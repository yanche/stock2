
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as facutil from '../facutil';

function dpid(pack: KDJFacPack): string { return `KDJ_${pack.N}_${pack.Nk}_${pack.Nd}_${pack.target}`; }

interface KDJFacPack {
    N: number,
    Nk: number,
    Nd: number,
    target: string
}

interface KDJRet {
    k: number,
    d: number,
    j: number
}

const genProg = utility.prog.genProg;

const kdjFac: IFactory<KDJFacPack, KDJRet> = {
    make: (pack: KDJFacPack) => {
        return bb.all([
            literal.resolve({ type: 'r.end', pack: pack.target }),
            literal.resolve({ type: 'r.high', pack: pack.target }),
            literal.resolve({ type: 'r.low', pack: pack.target }),
        ])
            .then(dps => {
                const epvd = <def.DataPvd<number>>dps[0], hpvd = <def.DataPvd<number>>dps[1], lpvd = <def.DataPvd<number>>dps[2];
                return new def.DataPvd<number>({
                    id: `RSV_${pack.N}`,
                    hasdef: epvd.hasDef_core,
                    gen: (ts: number): number => {
                        const bts = epvd.backwardTs(ts, pack.N - 1);
                        const cur = epvd.get(ts), H = utility.array.max(hpvd.period(bts, ts), x => x.val).val, L = utility.array.min(lpvd.period(bts, ts), x => x.val).val;
                        return H === L ? 50 : ((cur - L) / (H - L) * 100);
                    },
                    genrtprog: () => {
                        let Hmax: utility.prog.Prog = null, Lmin: utility.prog.Prog = null;
                        const h = <utility.prog.Prog>hpvd.getRTProg(), l = <utility.prog.Prog>lpvd.getRTProg(), e = <utility.prog.Prog>epvd.getRTProg();
                        if (pack.N > 1) {
                            const bts = epvd.backwardTs(epvd.maxTs, pack.N - 2);
                            const H = utility.array.max(hpvd.period(bts, epvd.maxTs), x => x.val).val, L = utility.array.min(lpvd.period(bts, epvd.maxTs), x => x.val).val;
                            Hmax = genProg('max', H, h);
                            Lmin = genProg('min', L, l);
                        }
                        else {
                            Hmax = h;
                            Lmin = l;
                        }
                        return genProg('mul', 100, genProg('div', genProg('sub', e, Lmin), genProg('sub', Hmax, Lmin)));
                    },
                    minTs: epvd.forwardTs(epvd.minTs, pack.N - 1) || facutil.dateTsOffset(epvd.maxTs, 1),
                    maxTs: epvd.maxTs,
                    remoteTs: epvd.remoteTs_core,
                    weakdepts: epvd.weakdepts
                })
            })
            .then(rsvpvd => literal.resolve({ type: 'b.ema', pack: { N: pack.Nk - 1, W: 1, dp: rsvpvd } }))
            .then(kpvd => bb.all([kpvd, literal.resolve({ type: 'b.ema', pack: { N: pack.Nd - 1, W: 1, dp: kpvd } })]))
            .then(data => {
                const kpvd = <def.DataPvd<number>>data[0], dpvd = <def.DataPvd<number>>data[1];
                return new def.StoredDataPvd<KDJRet>({
                    id: dpid(pack),
                    hasdef: dpvd.hasDef_core,
                    gen: (ts: number): KDJRet => {
                        const k = kpvd.get(ts), d = dpvd.get(ts);
                        return {
                            k: k,
                            d: d,
                            j: k * 3 - d * 2
                        };
                    },
                    genrtprog: () => {
                        const k = genProg('ref', 'k'), d = genProg('ref', 'd');
                        return genProg('begin',
                            genProg('def', 'k', kpvd.getRTProg()),
                            genProg('def', 'd', dpvd.getRTProg()),
                            genProg('obj', {
                                k: k,
                                d: d,
                                j: genProg('sub', genProg('mul', 3, k), genProg('mul', 2, d))
                            }));
                    },
                    remoteTs: dpvd.remoteTs_core,
                    minTs: dpvd.minTs,
                    maxTs: dpvd.maxTs,
                    weakdepts: [pack.target]
                });
            });
    },
    validate: (pack: KDJFacPack): boolean => utility.validate.posInt(pack.N) && utility.validate.posInt(pack.Nk) && utility.validate.posInt(pack.Nd) && utility.validate.nonEmptyStr(pack.target),
    dpid: dpid,
    weakDepts: (pack: KDJFacPack): Array<string> => [pack.target]
};

export default kdjFac;
