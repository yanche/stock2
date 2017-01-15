
import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as bb from 'bluebird';

interface MAFacPack extends facutil.TransformPackBase<number> {
    N: number
}

const maFac = facutil.dpTransform<MAFacPack, number, number>({
    prefix: 'MA',
    inputlist: [{ name: 'N', validate: utility.validate.posInt }],
    gen: (pack: MAFacPack, dp: def.DataPvd<number>, ts: number, selfdp: def.DataPvd<number>): number => {
        const N = pack.N;
        if (pack.N > 1) {
            const bts1day = dp.backwardTs(ts, 1);
            if (bts1day != null && selfdp.cached(bts1day)) {
                // use yesterday's MA to calculate todays's quickly
                // console.log('use quick calc-MA');
                return selfdp.get(bts1day) + (dp.get(ts) - dp.get(dp.backwardTs(bts1day, N - 1))) / N;
            }
        }
        const bts = dp.backwardTs(ts, N - 1);
        return utility.array.avg(dp.period(bts, ts), t => t.val);
    },
    genrtprog: (pack: MAFacPack, dp: def.DataPvd<number>) => {
        if (pack.N === 1) return dp.getRTProg();
        else {
            const bts = dp.backwardTs(dp.maxTs, pack.N - 2);
            const sum = utility.array.sum(dp.period(bts, dp.maxTs), v => v.val);
            return utility.prog.genProg('div', utility.prog.genProg('add', sum, dp.getRTProg()), pack.N);
        }
    },
    hasdefprog: (pack: MAFacPack, dp: def.DataPvd<number>) => dp.forwardTs(dp.minTs, pack.N - 2) != null,
    mmts: (pack: MAFacPack, dp: def.DataPvd<number>): { minTs: number, maxTs: number } => {
        return { minTs: dp.forwardTs(dp.minTs, pack.N - 1) || facutil.dateTsOffset(dp.maxTs, 1), maxTs: dp.maxTs };
    },
    stored: true
})

export default maFac;
