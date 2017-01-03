
//U字型转弯

import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as bb from 'bluebird';

interface UTurnFacPack extends facutil.TransformPackBase<number> {
    turnup: boolean;
}

const genProg = utility.prog.genProg;

const uturnPeakFac = facutil.dpTransform<UTurnFacPack, number, boolean>({
    prefix: 'UTURN',
    inputlist: [
        { name: 'turnup', validate: utility.validate.isBool }
    ],
    gen: (pack: UTurnFacPack, dp: def.DataPvd<number>, dts: number, selfdp: def.DataPvd<boolean>): boolean => {
        const v1 = dp.get(dp.backwardTs(dts, 2)), v2 = dp.get(dp.backwardTs(dts, 1)), v = dp.get(dts);
        if (pack.turnup) return v1 >= v2 && v > v2;
        return v1 <= v2 && v < v2;
    },
    genrtprog: (pack: UTurnFacPack, dp: def.DataPvd<number>) => {
        const v1 = dp.get(dp.backwardTs(dp.maxTs, 1)), v2 = dp.get(dp.maxTs);
        if ((pack.turnup && v1 >= v2) || (!pack.turnup && v1 <= v2)) return utility.prog.genProg(pack.turnup ? '>' : '<', dp.getRTProg(), v2);
        else return false;
    },
    mmts: (pack: UTurnFacPack, dp: def.DataPvd<number>): { minTs: number, maxTs: number } => {
        return { minTs: dp.forwardTs(dp.minTs, 2) || facutil.dateTsOffset(dp.maxTs, 1), maxTs: dp.maxTs };
    }
})

export { uturnPeakFac }
