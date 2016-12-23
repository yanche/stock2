
import * as datapvd from '../datapvd';
import * as bb from 'bluebird';
import * as utility from '../utility';

interface HypoOutRec {
    name: string;
    hts?: number;
    hp?: number;
    lts?: number;
    lp?: number;
    ets?: number;
    ep?: number;
    rev?: number;
}

export interface HypoRec {
    sts: number;
    sp: number;
    envs: Array<{ name: string, val: any }>;
    outrecs: Array<HypoOutRec>
}

export function run(options: {
    target: string;
    dp: datapvd.def.DataPvd<boolean>;
    dpouts: Array<{ name: string, dp: datapvd.def.DataPvd<boolean> }>;
    envdps: Array<{ name: string, dp: datapvd.def.DataPvd<any> }>;
    glong: boolean;
    minDateTs: number;
    maxDateTs: number;
}): bb<Array<HypoRec>> {
    return bb.all([
        datapvd.literal.resolve({ type: 'r.end', pack: options.target }),
        datapvd.literal.resolve({ type: 'r.high', pack: options.target }),
        datapvd.literal.resolve({ type: 'r.low', pack: options.target })
    ])
        .then(pvds => {
            const epvd = pvds[0], hpvd = pvds[1], lpvd = pvds[2], hypos: Array<HypoRec> = [];
            const maxDateTs = Math.min(options.maxDateTs, options.dp.maxTs);
            let ts = Math.max(options.minDateTs, options.dp.minTs);
            if (ts != null && maxDateTs != null) {
                while (ts != null && ts <= maxDateTs) {
                    if (!epvd.hasDef(ts)) throw new Error(`${options.target} has no definition in dp-date: ${utility.date.dateFormat(utility.date.dateTs2MsTs(ts))}`);
                    const h = hpvd.get(ts), l = lpvd.get(ts), e = epvd.get(ts);
                    for (const hr of hypos) {
                        for (let j = 0; j < hr.outrecs.length; ++j) {
                            const outrec = hr.outrecs[j], dpout = options.dpouts[j];
                            if (outrec.ets != null) continue; //已结算
                            if (outrec.hp == null || h > outrec.hp) {
                                outrec.hp = h;
                                outrec.hts = ts;
                            }
                            if (outrec.lp == null || l < outrec.lp) {
                                outrec.lp = l;
                                outrec.lts = ts;
                            }
                            const dpoutret = dpout.dp.get(ts, {
                                sts: hr.sts,
                                hts: outrec.hts,
                                lts: outrec.lts
                            });
                            if (dpoutret) {
                                outrec.ets = ts;
                                outrec.ep = e;
                                outrec.rev = rev(options.glong, hr.sp, e);
                            }
                        }
                    }

                    const dpret = options.dp.get(ts);
                    if (dpret) {
                        hypos.push({
                            sp: e,
                            sts: ts,
                            envs: calcEnvVals(options.envdps, ts),
                            outrecs: options.dpouts.map(dpout => {
                                return { name: dpout.name };
                            })
                        });
                    }

                    ts = options.dp.forwardTs(ts, 1);
                }
            }
            return hypos;
        });
}

export function rev(glong: boolean, sp: number, ep: number) {
    return glong ? ep / sp : sp / ep;
}

function calcEnvVals(envdps: Array<{ name: string, dp: datapvd.def.DataPvd<any> }>, sts: number) {
    return envdps.map(r => {
        return {
            name: r.name,
            val: r.dp.get(sts)
        };
    });
}
