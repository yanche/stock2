
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';

function dpid(pack: RSIFacPack): string { return `RSI_${pack.N}_${pack.target}`; }

interface RSIFacPack {
    N: number,
    target: string
}

const rsiFac: IFactory<RSIFacPack, number> = {
    make: (pack: RSIFacPack) => {
        return literal.resolve({ type: 'r.grow', pack: pack.target })
            .then(gpvd => bb.all([
                literal.resolve({
                    type: 'c.max', pack: {
                        list: [gpvd, { type: 'r.const', pack: 0 }],
                        defidx: 0
                    }
                }),
                literal.resolve({ type: 'c.abs', pack: { dp: gpvd } })
            ]))
            .then(data => bb.all([
                literal.resolve({ type: 'b.ema', pack: { N: pack.N - 1, W: 1, dp: data[0] } }),
                literal.resolve({ type: 'b.ema', pack: { N: pack.N - 1, W: 1, dp: data[1] } })
            ]))
            .then(data => {
                const Aema = <def.IterDataPvd<number>>data[0], Bema = <def.IterDataPvd<number>>data[1];
                return bb.resolve(new def.StoredDataPvd<number>({
                    id: dpid(pack),
                    maxTs: Aema.maxTs,
                    minTs: Aema.minTs,
                    hasdef: Aema.hasDef_core,
                    hasdefprog: Aema.hasDefProg_core,
                    gen: (ts: number): number => {
                        return 100 * Aema.get(ts) / Bema.get(ts);
                    },
                    genrtprog: () => {
                        return utility.prog.genProg('mul', 100, utility.prog.genProg('div', Aema.getRTProg(), Bema.getRTProg()));
                    },
                    remoteTs: Aema.remoteTs_core,
                    weakdepts: Aema.weakdepts
                }));
            });
    },
    validate: (pack: RSIFacPack): boolean => utility.validate.posInt(pack.N) && utility.validate.valueStr(pack.target),
    dpid: dpid,
    weakDepts: (pack: RSIFacPack): Array<string> => [pack.target]
};

export default rsiFac;
