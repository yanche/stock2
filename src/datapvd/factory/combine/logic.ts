
import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as bb from 'bluebird';

const and = facutil.dpUnion({ min: 2, prefix: 'and', gen: (vlist: Array<boolean>) => vlist.every(l => l === true), rtprogfn: 'and' });
const or = facutil.dpUnion({ min: 2, prefix: 'or', gen: (vlist: Array<boolean>) => vlist.some(l => l === true), rtprogfn: 'or' });
const eq = facutil.dpUnion({
    min: 2,
    prefix: 'eq',
    gen: (vlist: Array<any>) => {
        const first = vlist[0];
        return vlist.slice(1).every(l => l === first);
    },
    rtprogfn: 'eq'
});
const gt = facutil.dpUnion({ min: 2, max: 2, prefix: 'gt', gen: (vlist: Array<number>) => vlist[0] > vlist[1], rtprogfn: 'gt' });
const gte = facutil.dpUnion({ min: 2, max: 2, prefix: 'gte', gen: (vlist: Array<number>) => vlist[0] >= vlist[1], rtprogfn: 'gte' });
const lt = facutil.dpUnion({ min: 2, max: 2, prefix: 'lt', gen: (vlist: Array<number>) => vlist[0] < vlist[1], rtprogfn: 'lt' });
const lte = facutil.dpUnion({ min: 2, max: 2, prefix: 'lte', gen: (vlist: Array<number>) => vlist[0] <= vlist[1], rtprogfn: 'lte' });
const between = facutil.dpUnion({ min: 3, max: 3, prefix: 'between', gen: (vlist: Array<number>) => vlist[0] >= vlist[1] && vlist[0] <= vlist[2], rtprogfn: 'between' });
const not = facutil.dpTransform({
    prefix: 'not',
    gen: (pack: facutil.TransformPackBase<boolean>, dp: def.DataPvd<boolean>, ts: number): boolean => {
        return !dp.get(ts);
    },
    genrtprog(pack: facutil.TransformPackBase<boolean>, dp: def.DataPvd<boolean>) {
        return utility.prog.genProg('not', dp.getRTProg());
    }
})

export { and, or, eq, gt, gte, lt, lte, between, not };
