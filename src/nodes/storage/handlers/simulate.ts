
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as db from '../db';
import * as bb from 'bluebird';
import * as hutil from './util';
import * as d from '../../def';
import { verb } from "../../../const";

export function handler(h: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) {
            h.status = 404;
            log.error(`simulate handler not found for verb: ${verb}`);
        }
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
            sdts: httpbody.sdts,
            sp: httpbody.sp,
            hdts: httpbody.hdts || null,
            hp: httpbody.hp || null,
            ldts: httpbody.ldts || null,
            lp: httpbody.lp || null,
            edts: httpbody.edts || null,
            ep: httpbody.ep || null,
            glong: httpbody.glong,
            rtplanId: httpbody.rtplanId,
            env: httpbody.env || [],
            concernsIn: httpbody.concernsIn || [],
            concernsOut: httpbody.concernsOut || [],
            createdTs: new Date().getTime()
        };
        this._valid = utility.validate.valueStr(this._mongodoc.target) && utility.validate.isBool(this._mongodoc.closed) && utility.validate.isBool(this._mongodoc.glong)
            && utility.validate.valueStr(this._mongodoc.rtplanId) && Array.isArray(this._mongodoc.env) && Array.isArray(this._mongodoc.concernsIn) && Array.isArray(this._mongodoc.concernsOut)
            && utility.validate.posInt(this._mongodoc.sdts) && utility.validate.posNum(this._mongodoc.sp)
            && ((utility.validate.posInt(this._mongodoc.hdts) && utility.validate.posNum(this._mongodoc.hp)) || (this._mongodoc.hdts == null && this._mongodoc.hp == null))
            && ((utility.validate.posInt(this._mongodoc.ldts) && utility.validate.posNum(this._mongodoc.lp)) || (this._mongodoc.ldts == null && this._mongodoc.lp == null))
            && ((utility.validate.posInt(this._mongodoc.edts) && utility.validate.posNum(this._mongodoc.ep)) || (this._mongodoc.edts == null && this._mongodoc.ep == null));
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set(verb.REMOVE, hutil.genRemoveAllHandler(db.simulate));
handlermap.set(verb.BULKUPDATE, hutil.genBulkUpdateHandler(db.simulate, false));
handlermap.set(verb.UPDATE, hutil.genUpdateAllHandler(db.simulate, false));
handlermap.set(verb.GETONE, hutil.genGetOneHandler(db.simulate));
handlermap.set(verb.GETMUL, hutil.genGetMulHandler(db.simulate));
handlermap.set(verb.GETALL, hutil.genGetAllHandler(db.simulate));
handlermap.set(verb.CREATEONE, hutil.genCreateOneHandler(db.simulate, (httpbody: any) => new SimulateCreateModel(httpbody)));
handlermap.set(verb.CREATEMUL, hutil.genCreateMulHandler(db.simulate, (httpbody: any) => new SimulateCreateModel(httpbody)));
