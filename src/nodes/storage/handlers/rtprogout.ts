
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';
import * as d from '../../def';
import { verb } from "../../../const";

export function handler(h: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) {
            h.status = 404;
            log.error(`rtprogout handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

class RtprogOutCreateModel implements hutil.HandlerDataModel {
    private _valid: boolean;
    private _mongodoc: d.RtprogOut;

    valid(): boolean { return this._valid; }
    toMongoDoc(): d.RtprogOut { return this._mongodoc; }
    constructor(httpbody: d.RtprogOut) {
        this._mongodoc = {
            target: httpbody.target,
            glong: httpbody.glong,
            rtplanId: httpbody.rtplanId,
            rtprog: httpbody.rtprog,
            createdTs: new Date().getTime(),
            sdts: httpbody.sdts,
            sp: httpbody.sp,
            hdts: httpbody.hdts || null,
            hp: httpbody.hp || null,
            ldts: httpbody.ldts || null,
            lp: httpbody.lp || null
        };
        this._valid = utility.validate.valueStr(this._mongodoc.target) && utility.validate.isBool(this._mongodoc.glong)
            && utility.validate.valueStr(this._mongodoc.rtplanId) && utility.validate.isObj(this._mongodoc.rtprog)
            && utility.validate.posInt(this._mongodoc.sdts) && utility.validate.posNum(this._mongodoc.sp)
            && ((utility.validate.posInt(this._mongodoc.hdts) && utility.validate.posNum(this._mongodoc.hp)) || (this._mongodoc.hdts == null && this._mongodoc.hp == null))
            && ((utility.validate.posInt(this._mongodoc.ldts) && utility.validate.posNum(this._mongodoc.lp)) || (this._mongodoc.ldts == null && this._mongodoc.lp == null));
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set(verb.GETONE, hutil.genGetOneHandler(db.rtprogout));
handlermap.set(verb.GETMUL, hutil.genGetMulHandler(db.rtprogout));
handlermap.set(verb.GETALL, hutil.genGetAllHandler(db.rtprogout));
handlermap.set(verb.REMOVE, hutil.genRemoveAllHandler(db.rtprogout));
handlermap.set(verb.BULKUPDATE, hutil.genBulkUpdateHandler(db.rtprogout, false));
handlermap.set(verb.CREATEONE, hutil.genCreateOneHandler(db.rtprogout, (httpbody: any) => new RtprogOutCreateModel(httpbody)));
handlermap.set(verb.CREATEMUL, hutil.genCreateMulHandler(db.rtprogout, (httpbody: any) => new RtprogOutCreateModel(httpbody)));
