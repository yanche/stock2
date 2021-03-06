
import IFactory from '../fac';
import * as utility from '../../../utility';
import * as dpm from '../../dpm';
import * as def from '../../def';
import * as datadef from '../../../datadef';
import * as bb from "bluebird";

function facOfFac(ref: string): IFactory<string, number> {
    function dpid(target: string): string { return `${ref}_${target}` }

    return {
        make: (target: string) => bb.resolve().then(() => dpm.getRawData(target))
            .then(raw => new def.DataPvd<number>({
                id: dpid(target),
                hasdef: ts => raw.hasDef(ts),
                hasdefprog: utility.validate.alwaysTrue,
                gen: ts => getRawVal(ref, raw.get(ts)),
                minTs: raw.minDateTs,
                maxTs: raw.maxDateTs,
                remoteTs: (ts: number, n: number, forward: boolean): number => {
                    return forward ? raw.forwardDts(ts, n) : raw.backwardDts(ts, n);
                },
                weakdepts: [target],
                genrtprog: () => {
                    return utility.prog.genProg('prop', utility.prog.genProg('ref', target), ref);
                }
            })),
        validate: utility.validate.valueStr,
        dpid: dpid,
        weakDepts: (target: string) => [target]
    }
}

function getRawVal(ref: string, data: datadef.RawDataSlice): number {
    switch (ref) {
        case 's': return data.s;
        case 'e': return data.e;
        case 'l': return data.l;
        case 'h': return data.h;
        case 'v': return data.v;
        case 'ex': return data.ex;
        case 'nr': return data.nr;
        case 'mv': return data.mv;
        default: throw new Error(`unknown ref of raw-data: ${ref}`);
    }
}

const start = facOfFac('s');
const end = facOfFac('e');
const high = facOfFac('h');
const low = facOfFac('l');
const ex = facOfFac('ex');
const vol = facOfFac('v');
const marketvalue = facOfFac('mv');
const netrate = facOfFac('nr');

export { start, end, high, low, ex, vol, marketvalue, netrate }
