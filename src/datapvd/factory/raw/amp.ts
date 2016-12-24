
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as facutil from '../facutil';

function dpid(target: string): string { return `AMP_${target}`; }

const ampFac: IFactory<string, number> = {
    make: (target: string) => {
        return bb.all([literal.resolve({ type: 'r.end', pack: target }), literal.resolve({ type: 'r.high', pack: target }), literal.resolve({ type: 'r.low', pack: target })])
            .then(pvdlist => {
                const epvd: def.DataPvd<number> = pvdlist[0], hpvd: def.DataPvd<number> = pvdlist[1], lpvd: def.DataPvd<number> = pvdlist[2];
                return new def.StoredDataPvd<number>({
                    id: dpid(target),
                    maxTs: epvd.maxTs,
                    minTs: epvd.forwardTs(epvd.minTs, 1) || facutil.dateTsOffset(epvd.maxTs, 1),
                    hasdef: epvd.hasDef_core,
                    gen: (ts) => {
                        const bts = epvd.backwardTs(ts, 1);
                        return (hpvd.get(ts) - lpvd.get(ts)) / epvd.get(bts);
                    },
                    genrtprog: () => {
                        return utility.prog.genProg(
                            'div',
                            utility.prog.genProg(
                                'sub',
                                hpvd.getRTProg(),
                                lpvd.getRTProg()
                            ),
                            epvd.getRTProg()
                        );
                    },
                    remoteTs: epvd.remoteTs_core,
                    weakdepts: epvd.weakdepts
                });
            });
    },
    validate: utility.validate.valueStr,
    dpid: dpid,
    weakDepts: (target: string) => [target]
};

export default ampFac;
