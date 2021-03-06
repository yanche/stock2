
import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as bb from 'bluebird';

const add = facutil.dpUnion({ prefix: 'add', gen: utility.array.sum2, rtprogfn: 'add' });
const sub = facutil.dpUnion({ prefix: 'sub', gen: utility.array.sub2, rtprogfn: 'sub' });
const mul = facutil.dpUnion({ prefix: 'mul', gen: utility.array.mul2, rtprogfn: 'mul' });
const div = facutil.dpUnion({ prefix: 'div', gen: utility.array.div2, rtprogfn: 'div' });
const max = facutil.dpUnion({ prefix: 'max', gen: utility.array.max2, rtprogfn: 'max' });
const min = facutil.dpUnion({ prefix: 'min', gen: utility.array.min2, rtprogfn: 'min' });

interface PowPack extends facutil.TransformPackBase<number> {
    exp: number
}
const pow = facutil.dpTransform<PowPack, number, number>({
    prefix: 'POW',
    inputlist: [{ name: 'exp', validate: utility.validate.posNum }],
    gen: (pack: PowPack, dp: def.DataPvd<number>, ts: number, selfdp: def.DataPvd<number>): number => {
        return Math.pow(dp.get(ts), pack.exp);
    },
    genrtprog: (pack: PowPack, dp: def.DataPvd<number>) => {
        return utility.prog.genProg('pow', dp.getRTProg(), pack.exp);
    }
})

interface AbsPack extends facutil.TransformPackBase<number> { }
const abs = facutil.dpTransform<AbsPack, number, number>({
    prefix: 'ABS',
    gen: (pack: AbsPack, dp: def.DataPvd<number>, ts: number, selfdp: def.DataPvd<number>): number => {
        return Math.abs(dp.get(ts));
    },
    genrtprog: (pack: PowPack, dp: def.DataPvd<number>) => {
        return utility.prog.genProg('abs', dp.getRTProg());
    }
})

export { add, sub, mul, div, max, min, pow, abs };
