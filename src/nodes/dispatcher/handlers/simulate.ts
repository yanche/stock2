
import * as utility from '../../../utility';
import * as db from '../db';
import * as bb from 'bluebird';
import * as hutil from './util';
import * as d from '../../def';

export function handler(h: utility.http.HttpPack) {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) return bb.reject(new Error(`simulate handler not found for verb: ${verb}`));
        else return fn(h);
    });
}

class SimulateCreateModel implements hutil.HandlerDataModel {
    private _valid: boolean;
    private _mongodoc: d.Simulate;

    valid(): boolean { return this._valid; }
    toMongoDoc(): d.Simulate { return this._mongodoc; }
    constructor(httpbody: d.Simulate) {
        this._mongodoc = {
            closed: httpbody.closed,
            target: httpbody.target,
            sts: httpbody.sts,
            sp: httpbody.sp,
            hts: httpbody.hts || null,
            hp: httpbody.hp || null,
            lts: httpbody.lts || null,
            lp: httpbody.lp || null,
            ets: httpbody.ets || null,
            ep: httpbody.ep || null,
            glong: httpbody.glong,
            rtplanId: httpbody.rtplanId,
            env: httpbody.env || [],
            concernsIn: httpbody.concernsIn || [],
            concernsOut: httpbody.concernsOut || []
        };
        this._valid = utility.validate.valueStr(this._mongodoc.target) && utility.validate.isBool(this._mongodoc.closed) && utility.validate.isBool(this._mongodoc.glong)
            && utility.validate.valueStr(this._mongodoc.rtplanId) && Array.isArray(this._mongodoc.env) && Array.isArray(this._mongodoc.concernsIn) && Array.isArray(this._mongodoc.concernsOut)
            && utility.validate.posInt(this._mongodoc.sts) && utility.validate.posNum(this._mongodoc.sp)
            && ((utility.validate.posInt(this._mongodoc.hts) && utility.validate.posNum(this._mongodoc.hp)) || (this._mongodoc.hts == null && this._mongodoc.hp == null))
            && ((utility.validate.posInt(this._mongodoc.lts) && utility.validate.posNum(this._mongodoc.lp)) || (this._mongodoc.lts == null && this._mongodoc.lp == null))
            && ((utility.validate.posInt(this._mongodoc.ets) && utility.validate.posNum(this._mongodoc.ep)) || (this._mongodoc.ets == null && this._mongodoc.ep == null));
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('REMOVE', hutil.genRemoveAllHandler(db.simulate));
handlermap.set('BULKUPDATE', hutil.genBulkUpdateHandler(db.simulate, false));
handlermap.set('UPDATE', hutil.genUpdateAllHandler(db.simulate, false));
handlermap.set('GET', hutil.genGetOneHandler(db.simulate));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.simulate));
handlermap.set('GETALL', hutil.genGetAllHandler(db.simulate));
handlermap.set('CREATE', hutil.genCreateOneHandler(db.simulate, (httpbody: any) => new SimulateCreateModel(httpbody)));
handlermap.set('CREATEMUL', hutil.genCreateMulHandler(db.simulate, (httpbody: any) => new SimulateCreateModel(httpbody)));
