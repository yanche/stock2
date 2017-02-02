
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as constants from '../../../const';
import * as literal from '../../literal';
import * as facutil from '../facutil';

const genProg = utility.prog.genProg;

function dpid(pack: BollFacPack): string { return `BOLL_${pack.N}_${pack.W}_${literal.dpid(pack.dp)}`; }

interface BollFacPack {
    N: number,
    W: number,
    dp: def.DataPvd<number> | literal.LiteralDP
}

interface BollRet {
    up: number,
    mid: number,
    low: number
}

const bollFac: IFactory<BollFacPack, BollRet> = {
    make: (pack: BollFacPack) => {
        return literal.resolve(pack.dp)
            .then(dp => {
                return bb.all([
                    dp,
                    literal.resolve({
                        type: constants.dpType.basic.ma,
                        pack: {
                            N: pack.N,
                            dp: dp
                        }
                    })])
            })
            .then(data => {
                const dp: def.DataPvd<number> = data[0], mapvd: def.DataPvd<number> = data[1];
                return literal.resolve({
                    type: constants.dpType.combine.pow,
                    pack: {
                        dp: {
                            type: constants.dpType.basic.ma,
                            pack: {
                                dp: {
                                    type: constants.dpType.combine.pow,
                                    pack: {
                                        dp: {
                                            type: constants.dpType.combine.sub,
                                            pack: {
                                                list: [
                                                    mapvd,
                                                    dp
                                                ],
                                                defidx: 0
                                            }
                                        },
                                        exp: 2
                                    }
                                },
                                N: pack.N
                            }
                        },
                        exp: 0.5
                    }
                })
                    .then(pvd1 => {
                        return bb.resolve(new def.StoredDataPvd<BollRet>({
                            id: dpid(pack),
                            maxTs: pvd1.maxTs,
                            minTs: pvd1.minTs,
                            hasdef: dp.hasDef_core,
                            hasdefprog: () => dp.forwardTs(dp.minTs, 2 * pack.N - 3) != null,
                            gen: (dts: number): BollRet => {
                                const devi = pvd1.get(dts), maval = mapvd.get(dts);
                                return { up: maval + devi * pack.W, mid: maval, low: maval - devi * pack.W };
                            },
                            genrtprog: () => {
                                const deviw = genProg('mul', pvd1.getRTProg(), pack.W);
                                return genProg('begin',
                                    genProg('def', 'mid', mapvd.getRTProg()),
                                    genProg('def', 'deviw', deviw),
                                    genProg('obj', {
                                        up: genProg('add', genProg('ref', 'mid'), genProg('ref', 'deviw')),
                                        mid: genProg('ref', 'mid'),
                                        low: genProg('sub', genProg('ref', 'mid'), genProg('ref', 'deviw')),
                                    }));
                            },
                            remoteTs: dp.remoteTs_core,
                            weakdepts: dp.weakdepts
                        }));
                    });
            });
    },
    validate: (pack: BollFacPack): boolean => utility.validate.posInt(pack.N) && utility.validate.posInt(pack.W) && literal.validate(pack.dp),
    dpid: dpid,
    weakDepts: (pack: BollFacPack): Array<string> => literal.weakDepts(pack.dp)
};

export default bollFac;
