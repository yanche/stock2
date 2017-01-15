
//极大值 极小值
//仅往回看range天，不看未来

import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as bb from 'bluebird';

interface LocalPeakFacPack extends facutil.TransformPackBase<number> {
    range: number;
    peak: boolean;
}

export interface LocalPeakOutput {
    peak: boolean;
    //极值点的值（上一个交易日）
    value?: number;
}

const genProg = utility.prog.genProg;

const localPeakFac = facutil.dpTransform<LocalPeakFacPack, number, LocalPeakOutput>({
    prefix: 'LOCALPEAK',
    inputlist: [
        { name: 'range', validate: utility.validate.posInt },
        { name: 'peak', validate: utility.validate.isBool }
    ],
    gen: (pack: LocalPeakFacPack, dp: def.DataPvd<number>, dts: number, selfdp: def.DataPvd<LocalPeakOutput>): LocalPeakOutput => {
        const bdts = dp.backwardTs(dts, 1);
        const val = dp.get(dts), bval = dp.get(bdts);
        if ((pack.peak && val < bval) || (!pack.peak && val > bval)) {
            const prevs = dp.period(dp.backwardTs(bdts, pack.range), dp.backwardTs(bdts, 1));
            if (prevs.every(p => (pack.peak && p.val <= bval) || (!pack.peak && p.val >= bval))) {
                return {
                    peak: true,
                    value: bval
                }
            }
            else {
                return { peak: false };
            }
        }
        else return { peak: false };
    },
    genrtprog: (pack: LocalPeakFacPack, dp: def.DataPvd<number>) => {
        const bval = dp.get(dp.maxTs);
        const prevs = dp.period(dp.backwardTs(dp.maxTs, pack.range), dp.backwardTs(dp.maxTs, 1));
        if (prevs.every(p => (pack.peak && p.val <= bval) || (!pack.peak && p.val >= bval)))
            return genProg('begin',
                genProg('def', 'val', dp.getRTProg()),
                genProg('obj', {
                    peak: genProg(pack.peak ? '<' : '>', genProg('ref', 'val'), bval),
                    value: genProg('ref', 'val')
                }));
        else
            return { peak: false, __val: true };
    },
    mmts: (pack: LocalPeakFacPack, dp: def.DataPvd<number>): { minTs: number, maxTs: number } => {
        return { minTs: dp.forwardTs(dp.minTs, pack.range + 1) || facutil.dateTsOffset(dp.maxTs, 1), maxTs: dp.maxTs };
    },
    hasdefprog: (pack: LocalPeakFacPack, dp: def.DataPvd<number>) => {
        return dp.forwardTs(dp.minTs, pack.range) != null;
    },
    stored: true
})

export { localPeakFac }
