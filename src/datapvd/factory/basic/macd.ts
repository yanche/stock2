
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as facutil from '../facutil';

function dpid(pack: MACDFacPack): string { return `MACD_${pack.Ns}_${pack.Nl}_${pack.Na}_${literal.dpid(pack.dp)}`; }

interface MACDFacPack {
    Ns: number,
    Nl: number,
    Na: number,
    dp: def.DataPvd<number> | literal.LiteralDP
}

interface MACDRet {
    diff: number,
    dea: number,
    macd: number
}

const genProg = utility.prog.genProg;

const macdFac: IFactory<MACDFacPack, MACDRet> = {
    make: (pack: MACDFacPack) => {
        return literal.resolve(pack.dp)
            .then(dp => literal.resolve({
                type: 'c.sub',
                pack: {
                    list: [
                        { type: 'b.ema', pack: { N: pack.Ns, W: 2, dp: dp } }, //ema of Ns
                        { type: 'b.ema', pack: { N: pack.Nl, W: 2, dp: dp } }  //ema of Nl
                    ],
                    defidx: 1
                }
            }))
            .then(diffpvd => bb.all([diffpvd, literal.resolve({ type: 'b.ema', pack: { N: pack.Na, W: 2, dp: diffpvd } })]))
            .then(data => {
                const diffpvd = <def.DataPvd<number>>data[0], deapvd = <def.DataPvd<number>>data[1];
                return bb.resolve(new def.StoredDataPvd<MACDRet>({
                    id: dpid(pack),
                    maxTs: deapvd.maxTs,
                    minTs: deapvd.minTs,
                    hasdef: deapvd.hasDef_core,
                    hasdefprog: deapvd.hasDefProg_core,
                    gen: (ts: number): MACDRet => {
                        const diff = diffpvd.get(ts), dea = deapvd.get(ts);
                        return { diff: diff, dea: dea, macd: 2 * (diff - dea) };
                    },
                    genrtprog: () => {
                        const diff = genProg('ref', 'diff'), dea = genProg('ref', 'dea');
                        return genProg('begin',
                            genProg('def', 'diff', diffpvd.getRTProg()),
                            genProg('def', 'dea', deapvd.getRTProg()),
                            genProg('obj', {
                                diff: diff,
                                dea: dea,
                                macd: genProg('mul', 2, genProg('sub', diff, dea))
                            }));
                    },
                    remoteTs: deapvd.remoteTs_core,
                    weakdepts: deapvd.weakdepts
                }));
            });
    },
    validate: (pack: MACDFacPack): boolean => utility.validate.posInt(pack.Ns) && utility.validate.posInt(pack.Nl) && utility.validate.posInt(pack.Na) && pack.Ns < pack.Nl && literal.validate(pack.dp),
    dpid: dpid,
    weakDepts: (pack: MACDFacPack): Array<string> => literal.weakDepts(pack.dp)
};

export default macdFac;
