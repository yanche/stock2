
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as facutil from '../facutil';

function dpid(target: string): string { return `GROW_${target}`; }

const growFac: IFactory<string, number> = {
    make: (target: string) => {
        return literal.resolve({ type: 'r.end', pack: target })
            .then((epvd: def.DataPvd<number>) => bb.resolve(new def.StoredDataPvd<number>({
                id: dpid(target),
                maxTs: epvd.maxTs,
                minTs: epvd.forwardTs(epvd.minTs, 1) || facutil.dateTsOffset(epvd.maxTs, 1),
                hasdef: epvd.hasDef_core,
                hasdefprog: epvd.hasDefProg_core,
                gen: (ts) => {
                    const bts = epvd.backwardTs(ts, 1);
                    return epvd.get(ts) - epvd.get(bts);
                },
                genrtprog: () => {
                    return utility.prog.genProg(
                        'sub',
                        epvd.getRTProg(),
                        epvd.get(epvd.maxTs)
                    );
                },
                remoteTs: epvd.remoteTs_core,
                weakdepts: epvd.weakdepts
            })));
    },
    validate: utility.validate.valueStr,
    dpid: dpid,
    weakDepts: (target: string) => [target]
};

export default growFac;
