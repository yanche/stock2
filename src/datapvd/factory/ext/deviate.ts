
//高点回撤 低点反弹

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as bb from 'bluebird';
import * as constants from '../../../const';
import { LocalPeakOutput } from './localpeak';
import * as _ from 'lodash';

const genProg = utility.prog.genProg;

interface DeviateFacPack {
    //背离程度的阈值
    threshold: number,
    emaxRate: number,
    dp: literal.LiteralDP | def.DataPvd<number>,
    dpT: literal.LiteralDP | def.DataPvd<boolean>,
    //于所有dpT有定义的点 dpV,dp必须有定义
    dpV: literal.LiteralDP | def.DataPvd<number>,
    maxDays: number,
    peakRange: number
}

function dpid(pack: DeviateFacPack): string {
    return `DEVIATE_${pack.maxDays}_${pack.threshold}_${pack.emaxRate}_${pack.peakRange}_${literal.dpid(pack.dpT)}_${literal.dpid(pack.dpV)}_${literal.dpid(pack.dp)}`;
}

function weakdepts(pack: DeviateFacPack): Array<string> {
    return _.uniq([].concat(literal.weakDepts(pack.dp)).concat(literal.weakDepts(pack.dpT)).concat(literal.weakDepts(pack.dpV)));
}

//取极值用
function dpVPrc1(dpv: number, tdev: boolean): number {
    return tdev ? dpv : -dpv;
};
function dpVPrc1_rtprog(dpvrtprog: any, tdev: boolean): any {
    return tdev ? dpvrtprog : genProg('-', 0, dpvrtprog);
};

//计算是否满足thd条件用，输入为dpVPrc1的结果
function dpVPrc2(dpv1: number, tdev: boolean): number {
    return tdev ? dpv1 : (1 / dpv1);
};
function dpVPrc2_rtprog(dpv1rtprog: any, tdev: boolean): any {
    return tdev ? dpv1rtprog : genProg('/', 1, dpv1rtprog);
};

function rGood(r: number, tdev: boolean): boolean {
    return tdev ? (r > 1) : (r < 1);
};
function rGood_rtprog(rRtprog: any, tdev: boolean): any {
    return genProg(tdev ? '>' : '<', rRtprog, 1);
};

const deviateFac: IFactory<DeviateFacPack, number> = {
    make: (pack: DeviateFacPack) => {
        return bb.all([
            literal.resolve(pack.dp),
            literal.resolve(pack.dpT),
            literal.resolve(pack.dpV)
        ])
            .then(data => {
                const pvd: def.DataPvd<number> = data[0], dpT: def.DataPvd<boolean> = data[1], dpV: def.DataPvd<number> = data[2];
                const tdev = pack.threshold > 1;
                return new def.StoredDataPvd<number>({
                    id: dpid(pack),
                    maxTs: dpT.maxTs,
                    minTs: dpT.minTs,
                    hasdef: dpT.hasDef_core,
                    gen: (dts: number) => {
                        const tval = dpT.get(dts);
                        if (!tval) return 0;
                        const mindts = dpT.backwardTs(dts, pack.maxDays) || dpT.minTs;
                        if (mindts === dts) return 0;
                        const period = dpT.period(mindts, dpT.backwardTs(dts, 1)).filter(v => v.val).map(x => {
                            const dv = dpVPrc1(dpV.get(x.ts), tdev);
                            if (!utility.validate.posNum(dv)) throw new Error(`dpV returns non-positive number: ${tdev}, ${dv}, ${utility.date.dateTs2DateKey(x.ts)}`);
                            return { dts: x.ts, val: dv, included: true };
                        });
                        //不存在顶背离参照点
                        if (period.length === 0) return 0;
                        const curV = dpVPrc1(dpV.get(dts), tdev);
                        const min4peak = dpT.backwardTs(dts, pack.peakRange);
                        for (let i = period.length - 1; i >= 0; --i) {
                            const prevn = period[i];
                            if (min4peak == null || prevn.dts >= min4peak) {
                                if (curV < prevn.val) //当前值不是peakRange交易日内的极大值
                                    return 0;
                            }
                            else
                                break;
                        }

                        //局部极大值
                        for (let i = 0; i < period.length; ++i) {
                            const p = period[i];
                            const max4peak = dpT.forwardTs(p.dts, pack.peakRange);
                            for (let j = i + 1; j < period.length; ++j) {
                                const prevn = period[j];
                                if (!prevn.included)
                                    continue;
                                if (prevn.dts <= max4peak || max4peak == null) {
                                    if (prevn.val < p.val)
                                        prevn.included = false;
                                    else if (prevn.val > p.val)
                                        p.included = false;
                                }
                                else
                                    break;
                            }
                        }

                        const tpoints = period.filter(p => p.included), e = pvd.get(dts);
                        const r2 = e / (dpVPrc2(curV, tdev) * pack.threshold);
                        const ret = tpoints.map(d => {
                            const preve = pvd.get(d.dts);
                            return { em: preve * pack.emaxRate, r: r2 * dpVPrc2(d.val, tdev) / preve }; //, dts: d.dts };
                        });
                        return ret.filter(d => rGood(d.r, tdev) && (tdev ? (e > d.em) : (e < d.em))).length;
                    },
                    genrtprog: () => {
                        const mindts = dpT.backwardTs(dpT.maxTs, pack.maxDays - 1) || dpT.minTs;
                        const period = dpT.period(mindts, dpT.maxTs).filter(v => v.val).map(x => {
                            const dv = dpVPrc1(dpV.get(x.ts), tdev);
                            if (!utility.validate.posNum(dv)) throw new Error(`dpV returns non-positive number: ${tdev}, ${dv}, ${utility.date.dateTs2DateKey(x.ts)}`);
                            return { dts: x.ts, val: dv, included: true };
                        });
                        //不存在顶背离参照点
                        if (period.length == 0)
                            return 0;
                        //局部极大值
                        for (let i = 0; i < period.length; ++i) {
                            const p = period[i];
                            const max4peak = dpT.forwardTs(p.dts, pack.peakRange);
                            for (let j = i + 1; j < period.length; ++j) {
                                const prevn = period[j];
                                if (!prevn.included)
                                    continue;
                                if (prevn.dts <= max4peak || max4peak == null) {
                                    if (prevn.val < p.val)
                                        prevn.included = false;
                                    else if (prevn.val > p.val)
                                        p.included = false;
                                }
                                else
                                    break;
                            }
                        }
                        //当前点是否为局部最大值
                        const peakRangeTestVals = [], min4peak = dpT.backwardTs(dpT.maxTs, pack.peakRange - 1);
                        for (let i = period.length - 1; i >= 0; --i) {
                            const prevn = period[i];
                            if (prevn.dts >= min4peak || min4peak == null) {
                                if (prevn.included)
                                    peakRangeTestVals.push(prevn.val);
                            }
                            else
                                break;
                        }
                        //所有局部最大值的历史点
                        const tpoints = period.filter(d => d.included).map(d => {
                            const preve = pvd.get(d.dts);
                            return { em: preve * pack.emaxRate, rmid: dpVPrc2(d.val, tdev) / (preve * pack.threshold) };
                        });

                        const curV = dpVPrc1_rtprog(dpV.getRTProg(), tdev);
                        const eprog = pvd.getRTProg(), tprog = dpT.getRTProg();
                        return genProg('begin',
                            genProg('def', 'e', eprog),
                            genProg('def', 'curV', curV),
                            genProg('def', 'r2', genProg('/', genProg('ref', 'e'), dpVPrc2_rtprog(genProg('ref', 'curV'), tdev))),
                            genProg('if',
                                genProg('and', tprog, (peakRangeTestVals.length == 0) ? true : genProg('>=', genProg('ref', 'curV'), utility.array.max2(peakRangeTestVals))),
                                genProg('count', tpoints, genProg('and',
                                    genProg(tdev ? '>' : '<',
                                        genProg('ref', 'e'),
                                        genProg('prop',
                                            genProg('ref', '_item'),
                                            'em'
                                        )
                                    ),
                                    rGood_rtprog(genProg('*',
                                        genProg('ref', 'r2'),
                                        genProg('prop', genProg('ref', '_item'), 'rmid')),
                                        tdev))),
                                0));
                    },
                    remoteTs: dpT.remoteTs_core,
                    weakdepts: weakdepts(pack)
                });
            });
    },
    validate: (pack: DeviateFacPack) => utility.validate.posInt(pack.maxDays) && utility.validate.posInt(pack.peakRange)
        && utility.validate.posNum(pack.threshold) && utility.validate.posNum(pack.emaxRate) && literal.validate(pack.dp) && literal.validate(pack.dpT) && literal.validate(pack.dpV),
    dpid: dpid,
    weakDepts: weakdepts
};

export default deviateFac;
