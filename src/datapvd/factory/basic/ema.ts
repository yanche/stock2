
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';

function dpid(pack: EWAFacPack): string { return `EMA_${pack.N}_${pack.W}_${literal.dpid(pack.dp)}`; }

interface EWAFacPack {
    N: number,
    W: number,
    dp: def.DataPvd<number> | literal.LiteralDP
}

const emaFac: IFactory<EWAFacPack, number> = {
    make: (pack: EWAFacPack) => {
        return literal.resolve(pack.dp)
            .then((dp: def.DataPvd<number>) => {
                const emadp: def.IterDataPvd<number> = new def.IterDataPvd<number>({
                    id: dpid(pack),
                    maxTs: dp.maxTs,
                    minTs: dp.minTs,
                    hasdef: dp.hasDef_core,
                    hasdefprog: dp.hasDefProg_core,
                    gen: (ts: number): number => {
                        if (ts === dp.minTs) return dp.get(ts);
                        else return emadp.get(dp.backwardTs(ts, 1)) * (pack.N - pack.W + 1) / (pack.N + 1) + dp.get(ts) * pack.W / (pack.N + 1);
                    },
                    genrtprog: () => {
                        const last = emadp.get(emadp.maxTs) * (pack.N - pack.W + 1) / (pack.N + 1);
                        return utility.prog.genProg('add', last, utility.prog.genProg('mul', dp.getRTProg(), pack.W / (pack.N + 1)));
                    },
                    remoteTs: dp.remoteTs_core,
                    weakdepts: dp.weakdepts
                });
                return emadp;
            });
    },
    validate: (pack: EWAFacPack): boolean => utility.validate.posInt(pack.N) && utility.validate.posInt(pack.W) && literal.validate(pack.dp) && (pack.N + 1) >= pack.W,
    dpid: dpid,
    weakDepts: (pack: EWAFacPack): Array<string> => literal.weakDepts(pack.dp)
};

export default emaFac;
