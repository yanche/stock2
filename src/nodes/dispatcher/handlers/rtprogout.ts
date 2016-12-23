
import * as utility from '../../../utility';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';
import * as d from '../../def';

export function handler(h: utility.http.HttpPack) {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) return bb.reject(new Error(`rtprogout handler not found for verb: ${verb}`));
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
            sts: httpbody.sts,
            sp: httpbody.sp,
            hts: httpbody.hts || null,
            hp: httpbody.hp || null,
            lts: httpbody.lts || null,
            lp: httpbody.lp || null
        };
        this._valid = utility.validate.nonEmptyStr(this._mongodoc.target) && utility.validate.isBool(this._mongodoc.glong)
            && utility.validate.nonEmptyStr(this._mongodoc.rtplanId) && utility.validate.isObj(this._mongodoc.rtprog)
            && utility.validate.posInt(this._mongodoc.sts) && utility.validate.posNum(this._mongodoc.sp)
            && ((utility.validate.posInt(this._mongodoc.hts) && utility.validate.posNum(this._mongodoc.hp)) || (this._mongodoc.hts == null && this._mongodoc.hp == null))
            && ((utility.validate.posInt(this._mongodoc.lts) && utility.validate.posNum(this._mongodoc.lp)) || (this._mongodoc.lts == null && this._mongodoc.lp == null));
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('GET', hutil.genGetOneHandler(db.rtprogout));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.rtprogout));
handlermap.set('GETALL', hutil.genGetAllHandler(db.rtprogout));
handlermap.set('REMOVE', hutil.genRemoveAllHandler(db.rtprogout));
handlermap.set('BULKUPDATE', hutil.genBulkUpdateHandler(db.rtprogout, false));
handlermap.set('CREATE', hutil.genCreateOneHandler(db.rtprogout, (httpbody: any) => new RtprogOutCreateModel(httpbody)));
handlermap.set('CREATEMUL', hutil.genCreateMulHandler(db.rtprogout, (httpbody: any) => new RtprogOutCreateModel(httpbody)));
