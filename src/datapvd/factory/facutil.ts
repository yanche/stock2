
import IFactory from './fac';
import * as utility from '../../utility';
import * as literal from '../literal';
import * as def from '../def';
import * as bb from 'bluebird';

export function dateTsOffset(datets: number, days: number): number {
    return datets + days;
}

export interface TransformPackBase<TdpIn> {
    dp: def.DataPvd<TdpIn> | literal.LiteralDP,
    [name: string]: any
}

export function dpTransform<P extends TransformPackBase<TdpIn>, TdpIn, TdpOut>(options: {
    prefix: string,
    inputlist?: Array<{
        name: string,
        validate?: (val: any) => boolean,
        tostr?: (val: any) => string
    }>,
    gen: (pack: P, dp: def.DataPvd<TdpIn>, ts: number, selfdp: def.DataPvd<TdpOut>) => TdpOut,
    genrtprog: (pack: P, dp: def.DataPvd<TdpIn>) => utility.prog.Prog | string | number | boolean | Object,
    mmts?: (pack: P, dp: def.DataPvd<TdpIn>) => { minTs: number, maxTs: number },
    stored?: boolean
}): IFactory<P, TdpOut> {
    var inputlist = options.inputlist || [];
    if (!utility.validate.valueStr(options.prefix) || inputlist.some(item => !utility.validate.valueStr(item.name)))
        throw new Error(`bad input for dpTransform`);
    inputlist = inputlist.map(item => { return { name: item.name, validate: item.validate || utility.validate.alwaysTrue, tostr: item.tostr || utility.toStr }; });
    function dpid(pack: P): string {
        return [options.prefix, literal.dpid(pack.dp)].concat(inputlist.map(item => item.tostr(pack[item.name]))).join('_');
    }
    return {
        dpid: dpid,
        make: (pack: P): bb<def.DataPvd<TdpOut>> => {
            return literal.resolve(pack.dp).then((dp: def.DataPvd<TdpIn>) => {
                const mmret = options.mmts == null ? { minTs: dp.minTs, maxTs: dp.maxTs } : options.mmts(pack, dp);
                const retdp = new (options.stored ? def.StoredDataPvd : def.DataPvd)<TdpOut>({
                    id: dpid(pack),
                    hasdef: dp.hasDef_core,
                    gen: (ts: number): TdpOut => options.gen(pack, dp, ts, retdp),
                    genrtprog: () => { return options.genrtprog(pack, dp); },
                    remoteTs: dp.remoteTs_core,
                    minTs: mmret.minTs,
                    maxTs: mmret.maxTs,
                    weakdepts: dp.weakdepts
                });
                return retdp;
            })
        },
        validate: (pack: P): boolean => literal.validate(pack.dp) && inputlist.every(item => item.validate(pack[item.name])),
        weakDepts: (pack: P): Array<string> => literal.weakDepts(pack.dp)
    }
}

export interface UnionPackBase<TdpIn> {
    list: Array<def.DataPvd<TdpIn> | literal.LiteralDP>,
    defidx: number
}

export function dpUnion<P extends UnionPackBase<TdpIn>, TdpIn, TdpOut>(options: {
    prefix: string,
    gen: (vlist: Array<TdpIn>) => TdpOut,
    rtprogfn: string,
    min?: number,
    max?: number
}): IFactory<P, TdpOut> {
    const min = options.min || 1, max = options.max;
    if (!utility.validate.valueStr(options.prefix) || !utility.validate.posInt(min) || (!utility.validate.posInt(max) && max != null))
        throw new Error('bad input for dpUnion');
    function dpid(pack: P) {
        return `${options.prefix}_${pack.defidx}_${pack.list.map(l => literal.dpid(l)).join('_')}`;
    }
    return {
        dpid: dpid,
        make: (pack: P): bb<def.DataPvd<TdpOut>> => {
            return bb.all(pack.list.map(l => literal.resolve(l)))
                .then((dps: Array<def.DataPvd<TdpIn>>) => {
                    const defdp = dps[pack.defidx];
                    return new def.DataPvd<TdpOut>({
                        id: dpid(pack),
                        hasdef: defdp.hasDef_core,
                        gen: (ts: number): TdpOut => {
                            return options.gen(dps.map(dp => dp.get(ts)));
                        },
                        genrtprog: () => {
                            return utility.prog.genProg2(options.rtprogfn, dps.map(d => d.getRTProg()));
                        },
                        remoteTs: defdp.remoteTs_core,
                        minTs: defdp.minTs,
                        maxTs: defdp.maxTs,
                        weakdepts: defdp.weakdepts
                    });
                })
        },
        validate: (pack: P): boolean => utility.validate.nonNegNum(pack.defidx, true) && pack.defidx < pack.list.length && pack.list.every(l => literal.validate(l)),
        weakDepts: (pack: P): Array<string> => literal.weakDepts(pack.list[pack.defidx])
    }
}
