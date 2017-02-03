
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';
import * as d from '../../def';
import * as mongo from 'mongodb';

export function handler(h: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) {
            h.status = 404;
            log.error(`alert handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

class AlertCreateModel implements hutil.HandlerDataModel {
    private _valid: boolean;
    private _mongodoc: d.Alert;

    valid(): boolean { return this._valid; }
    toMongoDoc(): d.Alert { return this._mongodoc; }
    constructor(httpbody: d.Alert) {
        this._mongodoc = {
            _id: httpbody._id == null ? new mongo.ObjectID() : utility.mongo.convObjId(httpbody._id),
            alertPlanId: httpbody.alertPlanId,
            simulateId: httpbody.simulateId,
            target: httpbody.target,
            new: true,
            createdTs: new Date().getTime()
        };
        this._valid = this._mongodoc._id != null && utility.validate.valueStr(this._mongodoc.alertPlanId) && utility.validate.valueStr(this._mongodoc.simulateId)
            && utility.validate.valueStr(this._mongodoc.target)
    }
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('GET', hutil.genGetOneHandler(db.alert));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.alert));
handlermap.set('GETALL', hutil.genGetAllHandler(db.alert));
handlermap.set('CREATE', hutil.genCreateOneHandler(db.alert, (httpbody: any) => new AlertCreateModel(httpbody)));
handlermap.set('CREATEMUL', hutil.genCreateMulHandler(db.alert, (httpbody: any) => new AlertCreateModel(httpbody)));
handlermap.set('UPDATE', hutil.genUpdateAllHandler(db.alert, false));
handlermap.set('BULKUPDATE', hutil.genBulkUpdateHandler(db.alert, false));
