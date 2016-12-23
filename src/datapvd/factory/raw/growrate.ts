
import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as facutil from '../facutil';

function dpid(target: string): string { return `GROWRATE_${target}`; }

const growrateFac: IFactory<string, number> = {
    make: (target: string) => {
        return literal.resolve({ type: 'r.end', pack: target })
            .then((epvd: def.DataPvd<number>) => new def.StoredDataPvd<number>({
                id: dpid(target),
                maxTs: epvd.maxTs,
                minTs: epvd.forwardTs(epvd.minTs, 1) || facutil.dateTsOffset(epvd.maxTs, 1),
                hasdef: epvd.hasDef_core,
                gen: (ts) => {
                    const bts = epvd.backwardTs(ts, 1);
                    const be = epvd.get(bts);
                    return (epvd.get(ts) - be) / be;
                },
                genrtprog: () => {
                    return utility.prog.genProg(
                        'sub',
                        utility.prog.genProg(
                            'div',
                            epvd.getRTProg(),
                            epvd.get(epvd.maxTs)
                        )
                        , 1
                    );
                },
                remoteTs: epvd.remoteTs_core,
                weakdepts: epvd.weakdepts
            }));
    },
    validate: utility.validate.nonEmptyStr,
    dpid: dpid,
    weakDepts: (target: string) => [target]
};

export default growrateFac;
