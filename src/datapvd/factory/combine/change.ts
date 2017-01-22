
import IFactory from '../fac';
import * as def from '../../def';
import * as facutil from '../facutil';

const changeFac: IFactory<facutil.TransformPackBase<boolean>, boolean> = facutil.dpTransform<facutil.TransformPackBase<boolean>, boolean, boolean>({
    prefix: 'CHANGE',
    gen: (pack: facutil.TransformPackBase<boolean>, dp: def.DataPvd<boolean>, dts: number): boolean => {
        return dp.get(dts) && !dp.get(dp.backwardTs(dts, 1));
    },
    genrtprog: (pack: facutil.TransformPackBase<boolean>, dp: def.DataPvd<boolean>) => {
        if (dp.get(dp.maxTs)) return false;
        else return dp.getRTProg();
    },
    mmts: (pack: facutil.TransformPackBase<boolean>, dp: def.DataPvd<boolean>) => {
        return { minTs: dp.forwardTs(dp.minTs, 1) || facutil.dateTsOffset(dp.maxTs, 1), maxTs: dp.maxTs };
    }
});

export default changeFac;
