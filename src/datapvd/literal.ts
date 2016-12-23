
import * as def from './def';
import * as bb from 'bluebird';
import factories from './factory';
import * as dpm from './dpm';
import * as mods from '../mods';
import IFactory from './factory/fac';

var dpToCache = new Set<string>();
dpToCache.add('b.ma').add('b.boll').add('b.ema').add('b.kdj').add('b.macd').add('b.rsi').add('r.amp').add('r.grow').add('r.growrate').add('u.mktdays');

function dpCacheable(type: string): boolean {
    return dpToCache.has(type);
}

export interface LiteralDP {
    type: string,
    pack: any
}

function getDPFactory(type: string): IFactory<any, any> {
    const factory = factories.get(type);
    if (factory == null) throw new Error(`unknown dp type: ${type}`);
    return factory;
}

export function resolve(ldp: LiteralDP | def.DataPvd<any>): bb<def.DataPvd<any>> {
    if (ldp instanceof def.DataPvd)
        return bb.resolve(ldp);
    else {
        const type = ldp.type, pack = ldp.pack;
        const factory = getDPFactory(type);
        if (!factory.validate(pack)) return bb.reject(new Error(`bad input for dp type, ${type}, ${pack}`));
        if (dpCacheable(type)) {
            const weakdptgts = factory.weakDepts(pack);
            if (weakdptgts.length !== 1) {
                console.warn(`for cacheable dp, the dependant target is not 1, ${type}, ${weakdptgts.length}`);
                return factory.make(pack); //no cache then
            }
            else {
                return dpm.getDPCache(weakdptgts[0])
                    .then(dpcache => {
                        const dpid = factory.dpid(pack);
                        var dphub = dpcache.get(dpid);
                        if (dphub == null) {
                            console.log('create dp and then store in dpcache, ' + dpid);
                            dphub = new mods.Hub(() => factory.make(pack));
                            dpcache.set(dpid, dphub);
                        }
                        else
                            console.log('return dp from dpcache(dphub), ' + dpid);
                        return dphub.get();
                    });
            }
        }
        else {
            return factory.make(pack);
        }
    }
}

export function dpid(ldp: LiteralDP | def.DataPvd<any>): string {
    if (ldp instanceof def.DataPvd) return ldp.id;
    else return getDPFactory(ldp.type).dpid(ldp.pack);
}

export function validate(ldp: LiteralDP | def.DataPvd<any>): boolean {
    if (ldp instanceof def.DataPvd) return true;
    else return getDPFactory(ldp.type).validate(ldp.pack);
}

export function weakDepts(ldp: LiteralDP | def.DataPvd<any>): Array<string> {
    if (ldp instanceof def.DataPvd) return ldp.weakdepts;
    else return getDPFactory(ldp.type).weakDepts(ldp.pack);
}
