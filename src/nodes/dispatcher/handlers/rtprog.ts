
import * as utility from '../../../utility';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';
import * as d from '../../def';

export function handler(h: utility.http.HttpPack) {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) return bb.reject(new Error(`rtprog handler not found for verb: ${verb}`));
        else return fn(h);
    });
}

class RtprogCreateModel implements hutil.HandlerDataModel {
    private _valid: boolean;
    private _mongodoc: d.Rtprog;

    valid(): boolean { return this._valid; }
    toMongoDoc(): d.Rtprog { return this._mongodoc; }
    constructor(httpbody: d.Rtprog) {
        this._mongodoc = {
            target: httpbody.target,
            glong: httpbody.glong,
            rtplanId: httpbody.rtplanId,
            rtprog: httpbody.rtprog,
            createdTs: new Date().getTime()
        };
        this._valid = utility.validate.valueStr(this._mongodoc.target) && utility.validate.isBool(this._mongodoc.glong)
            && utility.validate.valueStr(this._mongodoc.rtplanId) && utility.validate.isObj(this._mongodoc.rtprog);
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('GET', hutil.genGetOneHandler(db.rtprog));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.rtprog));
handlermap.set('GETALL', hutil.genGetAllHandler(db.rtprog));
handlermap.set('REMOVE', hutil.genRemoveAllHandler(db.rtprog));
handlermap.set('BULKUPDATE', hutil.genBulkUpdateHandler(db.rtprog, false));
handlermap.set('CREATE', hutil.genCreateOneHandler(db.rtprog, (httpbody: any) => new RtprogCreateModel(httpbody)));
handlermap.set('CREATEMUL', hutil.genCreateMulHandler(db.rtprog, (httpbody: any) => new RtprogCreateModel(httpbody)));
