
import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as bb from 'bluebird';

interface OffsetFacPack extends facutil.TransformPackBase<any> {
    N: number
}

interface OffsetRet {
    val: any,
    ts: number
}

function mmts(pack: OffsetFacPack, dp: def.DataPvd<any>) {
    if (pack.N === 0) return { minTs: dp.minTs, maxTs: dp.maxTs };
    else if (pack.N > 0) return { minTs: dp.minTs, maxTs: dp.backwardTs(dp.maxTs, pack.N) || facutil.dateTsOffset(dp.minTs, -1) };
    else return { maxTs: dp.maxTs, minTs: dp.forwardTs(dp.minTs, -pack.N) || facutil.dateTsOffset(dp.maxTs, 1) };
}

function hasdefprog(pack: OffsetFacPack, dp: def.DataPvd<any>) {
    if (pack.N === 0) return true;
    else if (pack.N > 0) return false;
    else return dp.forwardTs(dp.minTs, -pack.N - 1) != null;
}

// N>0, future value, N<0 past value
const offsetFac: IFactory<OffsetFacPack, any> = facutil.dpTransform<OffsetFacPack, any, OffsetRet>({
    prefix: 'OFFSET',
    inputlist: [{ name: 'N', validate: (n: number) => utility.validate.isInt(n) && n !== 0 }],
    gen: (pack: OffsetFacPack, dp: def.DataPvd<any>, ts: number): OffsetRet => {
        const bts = pack.N > 0 ? dp.forwardTs(ts, pack.N) : dp.backwardTs(ts, -pack.N);
        return { val: dp.get(bts), ts: bts };
    },
    genrtprog: (pack: OffsetFacPack, dp: def.DataPvd<any>) => {
        if (pack.N > 0) throw new Error(`N greater than 0 for offset datapvd is not allowed in genrtprog`);
        const bts = dp.backwardTs(dp.maxTs, -pack.N - 1);
        return utility.prog.genProg('obj', { ts: bts, val: dp.get(bts) });
    },
    hasdefprog: hasdefprog,
    mmts: mmts
});

const offsetVFac: IFactory<OffsetFacPack, any> = facutil.dpTransform<OffsetFacPack, any, any>({
    prefix: 'OFFSETV',
    inputlist: [{ name: 'N', validate: (n: number) => utility.validate.isInt(n) && n !== 0 }],
    gen: (pack: OffsetFacPack, dp: def.DataPvd<any>, ts: number): bb<any> => {
        return dp.get(pack.N > 0 ? dp.forwardTs(ts, pack.N) : dp.backwardTs(ts, -pack.N));
    },
    genrtprog: (pack: OffsetFacPack, dp: def.DataPvd<any>) => {
        if (pack.N > 0) throw new Error(`N greater than 0 for offset datapvd is not allowed in genrtprog`);
        return dp.get(dp.backwardTs(dp.maxTs, -pack.N - 1));
    },
    hasdefprog: hasdefprog,
    mmts: mmts
});

export { offsetFac, offsetVFac };
