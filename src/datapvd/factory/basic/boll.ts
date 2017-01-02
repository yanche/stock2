
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
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
            .then(dp => bb.all([dp, literal.resolve({ type: 'b.ma', pack: { N: pack.N, dp: dp } })]))
            .then(data => {
                const mapvd = <def.DataPvd<number>>data[1], dp = <def.DataPvd<number>>data[0];
                return bb.resolve(new def.StoredDataPvd<BollRet>({
                    id: dpid(pack),
                    maxTs: dp.maxTs,
                    minTs: dp.forwardTs(dp.minTs, 2 * pack.N - 2) || facutil.dateTsOffset(dp.maxTs, 1),
                    hasdef: dp.hasDef_core,
                    gen: (dts: number): BollRet => {
                        const bdts = dp.backwardTs(dts, pack.N - 1);
                        const dpvallist = dp.period(bdts, dts), malist = mapvd.period(bdts, dts);
                        // (MA[(dp - ma)^2])^(1/2)
                        const W = pack.W;
                        const maval = malist[malist.length - 1].val;
                        const devi = Math.pow(utility.array.avg(dpvallist.map((v, idx) => Math.pow(v.val - malist[idx].val, 2)), t => t), 0.5);
                        return { up: maval + devi * W, mid: maval, low: maval - devi * W };
                    },
                    genrtprog: () => {
                        const vprog = dp.getRTProg(), mprog = mapvd.getRTProg();
                        let devi: utility.prog.Prog = null;
                        if (pack.N > 1) {
                            const bdts = dp.backwardTs(dp.maxTs, pack.N - 2);
                            const dpvallist = dp.period(bdts, dp.maxTs), malist = mapvd.period(bdts, dp.maxTs);
                            devi = genProg('pow',
                                genProg('div',
                                    genProg('add',
                                        genProg('pow', genProg('sub', vprog, mprog), 2),
                                        utility.array.sum2(dpvallist.map((v, idx) => Math.pow(v.val - malist[idx].val, 2)))),
                                    pack.N),
                                0.5);
                        }
                        else
                            devi = genProg('abs', genProg('sub', vprog, mprog));
                        const deviw = genProg('mul', devi, pack.W);
                        return genProg('begin',
                            genProg('def', 'mid', mprog),
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
    },
    validate: (pack: BollFacPack): boolean => utility.validate.posInt(pack.N) && utility.validate.posInt(pack.W) && literal.validate(pack.dp),
    dpid: dpid,
    weakDepts: (pack: BollFacPack): Array<string> => literal.weakDepts(pack.dp)
};

export default bollFac;
