
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as log from '../../../log';
import * as _ from 'lodash';
import * as filestorage from '../../../filestorage';
import * as dclient from '../../dclient';
import * as nutil from '../../util';
import * as datapvd from '../../../datapvd';
import * as def from '../../def';
import * as constant from '../../../const';
import * as config from '../../../config';

export interface SimulateInput {
    target: string;
    rtplanId: string;
    redo: boolean;
}

export interface SimulateOutput {
    old: number;
    new: number;
    closed: number;
    run: boolean;
}

export const action = new Action<SimulateInput, SimulateInput, SimulateOutput>({
    refine: utility.id,
    validate: (input: SimulateInput): boolean => {
        return utility.validate.valueStr(input.target) && utility.validate.valueStr(input.rtplanId) && utility.validate.isBool(input.redo);
    },
    resolve: (input: SimulateInput): bb<SimulateOutput> => {
        return dclient.rtplan.get({ _id: input.rtplanId })
            .then(rtplan => {
                if (rtplan == null) throw new Error(`rtplan not found for id: ${input.rtplanId}`);
                if (!nutil.rtplanScopeContains(input.target, rtplan.targetScope)) throw new Error(`rtplan does not match the target: ${JSON.stringify(rtplan.targetScope)}, ${input.target}`);
                return bb.all([
                    datapvd.literal.resolve({ type: 'r.end', pack: input.target }),
                    datapvd.literal.resolve({ type: 'r.high', pack: input.target }),
                    datapvd.literal.resolve({ type: 'r.low', pack: input.target }),
                    dclient.simtrack.getOrCreate({ target: input.target, rtplanId: input.rtplanId })
                ])
                    .then(data => {
                        const epvd: datapvd.def.DataPvd<number> = data[0], hpvd: datapvd.def.DataPvd<number> = data[1], lpvd: datapvd.def.DataPvd<number> = data[2], simtrack = data[3];
                        let prm: bb<{ sims: Array<def.Simulate>, startDts: number }> = null;
                        if (simtrack.lastSimDateTs == null || input.redo) {
                            let sdatets = epvd.forwardTs(epvd.minTs, 20);
                            if (sdatets != null) sdatets = epvd.forwardTs(Math.max(sdatets, rtplan.startDateTs), 0);
                            prm = dclient.simulate.remove({ target: input.target, rtplanId: input.rtplanId }).then(ret => log.info(`${ret.removed} simulates removed for ${input.target}, ${input.rtplanId}`))
                                .then(() => { return { sims: [], startDts: sdatets }; });
                        }
                        else {
                            prm = dclient.simulate.getAll({ target: input.target, rtplanId: input.rtplanId, closed: false })
                                .then(sims => {
                                    const corruptedSims = sims.filter(sim => (sim.edts || sim.sdts) !== simtrack.lastSimDateTs);
                                    if (corruptedSims.length > 0)
                                        throw new Error(`simulate.ets(or sts if ets is null) does not match simtrack.lastSimDateTs: ${[input.target, input.rtplanId, utility.date.dateTsFormat(simtrack.lastSimDateTs)].concat(corruptedSims.map(function (sim) { return `${utility.date.dateTsFormat(sim.sdts)}-${sim.edts == null ? 'null' : utility.date.dateTsFormat(sim.edts)}`; })).join(', ')}`);
                                    return { sims: sims, startDts: epvd.forwardTs(simtrack.lastSimDateTs, 1) };
                                });
                        }
                        return prm.then(data => {
                            const sims = data.sims, startDts = data.startDts;
                            if (startDts == null) return <SimulateOutput>{ run: false };
                            else {
                                log.info(`load ${sims.length} unclosed simulates`);
                                return bb.all([
                                    datapvd.literal.resolve(utility.meta.replace(rtplan.cpdefRef, _.extend({ target: input.target }, rtplan.envMap))),
                                    datapvd.literal.resolve(utility.meta.replace(rtplan.cpoutdefRef, _.extend({ target: input.target }, rtplan.envMap))),
                                    getConcerns(rtplan.envMap, (rtplan.concerns || {}).in || [], input.target),
                                    getConcerns(rtplan.envMap, (rtplan.concerns || {}).out || [], input.target),
                                ])
                                    .then(data => {
                                        const dpin: datapvd.def.DataPvd<boolean> = data[0], dpout: datapvd.def.DataPvd<boolean> = data[1];
                                        const concernsIn = data[2], concernsOut = data[3];
                                        let ts = startDts;
                                        return utility.whileLoop(() => bb.resolve(ts != null && ts <= epvd.maxTs), () => {
                                            return bb.resolve()
                                                .then(() => {
                                                    if (sims.length === 0) return;

                                                    //现有simulate清仓
                                                    return bb.all([
                                                        hpvd.get(ts),
                                                        lpvd.get(ts),
                                                        epvd.get(ts)
                                                    ])
                                                        .then(prices => {
                                                            const h = prices[0], l = prices[1], e = prices[2];
                                                            let idx = 0;
                                                            return utility.whileLoop(() => bb.resolve(idx < sims.length), () => {
                                                                return bb.resolve()
                                                                    .then(() => {
                                                                        const sim = sims[idx];
                                                                        if (sim.closed) return;
                                                                        if (sim.hp == null || sim.hp < h) {
                                                                            sim.hp = h;
                                                                            sim.hdts = ts;
                                                                        }
                                                                        if (sim.lp == null || sim.lp > l) {
                                                                            sim.lp = l;
                                                                            sim.ldts = ts;
                                                                        }
                                                                        sim.edts = ts;
                                                                        sim.ep = e;
                                                                        //出清条件满足
                                                                        if (dpout.get(ts, sim)) {
                                                                            //close it
                                                                            sim.closed = true;
                                                                            return resolveConcerns(concernsOut, input.target, rtplan.name, ts, sim)
                                                                                .then(cout => sim.concernsOut = cout);
                                                                        }
                                                                    })
                                                                    .then(() => idx++);
                                                            });
                                                        });
                                                })
                                                .then(() => {
                                                    if (ts < rtplan.startDateTs || dpout.get(ts) || !dpin.hasDef(ts) || !dpin.get(ts)) return;

                                                    //simulate建仓
                                                    return resolveConcerns(concernsIn, input.target, rtplan.name, ts, null)
                                                        .then(cin => {
                                                            //最高最低点第二天起算, 最低点可能高于sp, 最高点可能低于sp
                                                            sims.push({
                                                                closed: false,
                                                                sdts: ts,
                                                                sp: epvd.get(ts),
                                                                glong: rtplan.glong,
                                                                rtplanId: input.rtplanId,
                                                                concernsIn: cin,
                                                                target: input.target
                                                            });
                                                        });
                                                })
                                                .then(() => ts = epvd.forwardTs(ts, 1));
                                        });
                                    })
                                    .then(() => {
                                        return bb.all(sims.map(s => {
                                            return getEnv(s.sdts, s.edts)
                                                .then(env => s.env = env);
                                        }));
                                    })
                                    .then(() => {
                                        const newsims = sims.filter(s => s._id == null);
                                        return bb.resolve()
                                            .then(() => {
                                                if (newsims.length === 0) return;
                                                return dclient.simulate.createMul(newsims);
                                            })
                                            .then(() => {
                                                if (sims.length === newsims.length) return;
                                                return dclient.simulate.bulkUpdate(sims.filter(s => s._id != null).map(s => {
                                                    return {
                                                        filter: { _id: s._id },
                                                        update: {
                                                            $set: {
                                                                updateTs: new Date().getTime(),
                                                                env: s.env,
                                                                concernsOut: s.concernsOut,
                                                                ets: s.edts,
                                                                ep: s.ep,
                                                                hts: s.hdts,
                                                                hp: s.hp,
                                                                lts: s.ldts,
                                                                lp: s.lp,
                                                                closed: s.closed
                                                            }
                                                        }
                                                    };
                                                }));
                                            })
                                            .then(() => dclient.simtrack.update({ _id: simtrack._id }, { $set: { lastSimDateTs: epvd.maxTs } }))
                                            .then(() => {
                                                return {
                                                    closed: sims.filter(s => s.closed).length,
                                                    old: sims.length - newsims.length,
                                                    new: newsims.length,
                                                    run: true
                                                };
                                            });
                                    });
                            }
                        });
                    });
            });
    }
});

function getConcerns(envMap: Object, concernarr: Array<def.RtplanConcern>, target: string) {
    return bb.all(concernarr.map(c => {
        return datapvd.literal.resolve(utility.meta.replace(c.dpRef, _.extend({ target: target }, envMap)))
            .then(pvd => {
                return {
                    name: c.name,
                    view: c.view,
                    dp: pvd
                };
            })
    }));
}

function resolveConcerns(concernarr: Array<{ name: string, view: string, dp: datapvd.def.DataPvd<any> }>, target: string, rtplanname: string, ts: number, ctx: datapvd.def.DataGetterCtx) {
    return bb.all(concernarr.map(c => {
        const cret = c.dp.get(ts, ctx);
        let val: bb<any> = null;
        switch (c.view) {
            case constant.simconcern.viewtype.raw: {
                val = bb.resolve(cret);
                break;
            }
            case constant.simconcern.viewtype.dropfile: {
                val = filestorage.azure.upload(JSON.stringify(cret), [target, rtplanname, c.name, utility.randomStr()].join('_') + '.json', null, config.azurestorage.container.simconcern);
                break;
            }
            default:
                throw new Error(`unknown view type: ${c.view}`);
        }
        return val.then(v => {
            return {
                name: c.name,
                view: c.view,
                val: v
            };
        });;
    }));
}

function getEnv(sdatets: number, edatets: number) {
    return bb.all(config.maintainIdx.map(i => {
        return datapvd.literal.resolve({ type: 'r.end', pack: i })
            .then((ipvd: datapvd.def.DataPvd<number>) => {
                return { target: i, sp: ipvd.get(sdatets), ep: edatets == null ? null : ipvd.get(edatets) };
            });
    }));
}
