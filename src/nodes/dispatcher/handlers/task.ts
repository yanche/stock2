
import * as utility from '../../../utility';
import * as bb from 'bluebird';
import * as hutil from './util';
import * as constant from '../../../const';
import * as db from '../db';
import * as moment from 'moment';
import * as d from '../../def';
import * as mongo from 'mongodb';
import * as condition from '../condition';
import * as action from '../../action';

export function handler(h: utility.http.HttpPack) {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) return bb.reject(new Error(`task handler not found for verb: ${verb}`));
        else return fn(h);
    });
}

function newTaskStatusByCondition(taskcond: { type: string, pack?: any }) {
    return taskcond.type === constant.dispatcherCond.ok ? constant.task.status.prepared : constant.task.status.new;
};

class TaskCreateModel implements hutil.HandlerDataModel {
    private _valid: boolean;
    private _mongodoc: d.Task;

    valid(): boolean { return this._valid; }
    toMongoDoc(): d.Task { return this._mongodoc; }
    constructor(httpbody: d.Task) {
        this._mongodoc = {
            _id: httpbody._id == null ? new mongo.ObjectID() : utility.mongo.convObjId(httpbody._id),
            condition: httpbody.condition,
            constraints: httpbody.constraints,
            action: httpbody.action,
            comments: httpbody.comments || '',
            locality: httpbody.locality || null,
            statusId: newTaskStatusByCondition(httpbody.condition),
            createdTs: new Date().getTime(),
            processLog: [{ msg: 'newly created', ts: new Date().getTime() }],
            lastProcessTs: null,
            priority: 0,
            assigned: 0
        };
        this._valid = this._mongodoc._id != null && condition.validate(this._mongodoc.condition) && action.validate(this._mongodoc.action)
            && utility.validate.isObj(this._mongodoc.constraints) && utility.validate.isInt(this._mongodoc.constraints.timeoutLevel)
            && utility.validate.isInt(this._mongodoc.constraints.conditionCheckInterval) && utility.validate.nonNegNum(this._mongodoc.constraints.ttl, true);
    }
}

class TaskReportModel {
    private _valid: boolean;
    objId: mongo.ObjectID;
    processTs: number;
    statusId: number;
    recoverable: boolean;
    errmsg: string;
    quickview: any;

    get valid(): boolean {
        return this._valid;
    }
    constructor(httpbody: { _id: string, processTs: number, statusId: number, recoverable: boolean, errmsg?: string, quickview?: any }) {
        this.objId = utility.mongo.convObjId(httpbody._id);
        this.processTs = httpbody.processTs;
        this.statusId = httpbody.statusId;
        this.recoverable = httpbody.recoverable;
        this.errmsg = httpbody.errmsg || '';
        this.quickview = httpbody.quickview || null;
        this._valid = this.objId != null && utility.validate.posNum(this.processTs, true) && (this.statusId === constant.task.status.success || this.statusId === constant.task.status.failed);
    }
}

class TaskDispatchModel {
    private _valid: boolean;
    limit: Object;
    preference: Array<Object>;

    get valid(): boolean {
        return this._valid;
    }
    constructor(body: { limit: Object, preference: Array<Object> }) {
        this.preference = body.preference;
        this.limit = body.limit;
        this._valid = Array.isArray(this.preference) && this.preference.every(utility.validate.isObj) && (this.limit == null || utility.validate.isObj(this.limit));
    }
}

function dispatchFilter(limit: Object, preference: Array<Object>, searchprior: boolean): Object {
    const conds: Array<Object> = [{
        statusId: { $in: [constant.task.status.prepared, constant.task.status.timeout, constant.task.status.failed] },
        'constraints.ttl': { '$gt': 0 }
    }];
    if (searchprior) conds.push({ priority: 1 });
    if (limit) conds.push(limit);
    if (!searchprior && preference && preference.length > 0) conds.push(preference);
    return conds.length > 1 ? { $and: conds } : conds[0];
}

function dispatch(limit: Object, preference: Array<Object>, searchprior: boolean): bb<Object> {
    const flt = dispatchFilter(limit, preference, searchprior), nowts = new Date().getTime();
    return db.task.findAndModify(flt, {
        $set: { statusId: constant.task.status.processing, lastProcessTs: nowts },
        $push: { processLog: { ts: nowts, msg: `dispatched at ${utility.date.datetimeFormat(nowts)}` } },
        $inc: { 'constraints.ttl': -1, assigned: 1 }
    }, null, true, false)
        .then(task => {
            if (task == null) {
                if (searchprior) return dispatch(limit, preference, false);
                else {
                    if (preference.length > 0) return dispatch(limit, preference.slice(1), searchprior);
                    else return null;
                }
            }
            else return task;
        });
}

function dispatchHandler(hpack: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const model = new TaskDispatchModel(hpack.reqbody);
        if (!model.valid) {
            hpack.status = 400;
        }
        else {
            return dispatch(model.limit, model.preference, true)
                .then(task => {
                    if (task == null) hpack.status = 404;
                    else hpack.body = task;
                });
        }
    });
}

function statusIdUpdateHandler(hpack: utility.http.HttpPack, statusId: number, msg: string): bb<void> {
    return bb.resolve().then(() => {
        const objId = utility.mongo.convObjId(hpack.reqbody._id);
        if (objId == null) {
            hpack.status = 400;
            hpack.body = { errcode: 1 };
        }
        else {
            return db.task.getOne({ _id: objId }, { statusId: 1, constraints: 1 })
                .then((task: d.Task) => {
                    if (task == null) hpack.status = 404;
                    else {
                        if (task.statusId !== statusId) {
                            const updateobj: any = { $set: { statusId: statusId, nextConditionCheckTs: <Object>null }, $push: { processLog: { ts: new Date().getTime(), msg: msg } } };
                            if (task.constraints.ttl <= 0) updateobj.$set['constraints.ttl'] = 1;
                            return db.task.updateAll({ _id: objId }, updateobj, false);
                        }
                        else {
                            hpack.status = 400;
                            hpack.body = { errcode: 2 };
                        }
                    }
                })
                .then(() => { });
        }
    });
}

// function resumeHandler(hpack: utility.http.HttpPack): bb<void> {
//     return bb.resolve().then(() => {
//         const objId = utility.mongo.convObjId(hpack.reqbody._id);
//         if (objId == null) {
//             hpack.status = 400;
//             hpack.body = { errcode: 1 };
//         }
//         else {
//             return db.task.getOne({ _id: objId }, { statusId: 1, constraints: 1 })
//                 .then((task: d.Task) => {
//                     if (task == null) hpack.status = 404;
//                     else {
//                         if ([constant.task.status.success, constant.task.status.closed, constant.task.status.abandoned].every(s => s !== task.statusId)) {
//                             if (task.constraints.ttl <= 0) {
//                                 return db.task.updateAll({ _id: objId }, { $set: { 'constraints.ttl': 1 }, $push: { processLog: { ts: new Date().getTime(), msg: 'task resumed' } } }, false);
//                             }
//                             else {
//                                 hpack.status = 400;
//                                 hpack.body = { errcode: 3 };
//                             }
//                         }
//                         else {
//                             hpack.status = 400;
//                             hpack.body = { errcode: 2 };
//                         }
//                     }
//                 });
//         }
//     });
// }

function closeHandler(hpack: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const objId = utility.mongo.convObjId(hpack.reqbody._id);
        if (objId == null) {
            hpack.status = 400;
            hpack.body = { errcode: 1 };
        }
        else {
            return db.task.getOne({ _id: objId }, { statusId: 1, constraints: 1 })
                .then((task: d.Task) => {
                    if (task == null) hpack.status = 404;
                    else {
                        if ((task.statusId === constant.task.status.failed && task.constraints.ttl === 0) || [constant.task.status.success, constant.task.status.closed, constant.task.status.abandoned].some(s => s === task.statusId)) {
                            hpack.status = 400;
                            hpack.body = { errcode: 2 };
                        }
                        else {
                            return db.task.updateAll({ _id: objId }, { $set: { statusId: constant.task.status.closed }, $push: { processLog: { ts: new Date().getTime(), msg: 'task closed' } } }, false);
                        }
                    }
                })
                .then(() => { });
        }
    });
}

function upgradeHandler(hpack: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const objId = utility.mongo.convObjId(hpack.reqbody._id);
        if (objId == null) {
            hpack.status = 400;
            hpack.body = { errcode: 1 };
        }
        else {
            return db.task.getOne({ _id: objId }, { priority: 1 })
                .then((task: d.Task) => {
                    if (task == null) hpack.status = 404;
                    else if (task.priority >= 1) {
                        hpack.status = 400;
                        hpack.body = { errcode: 2 };
                    }
                    else return db.task.updateAll({ _id: objId }, { $set: { priority: 1 }, $push: { processLog: { ts: new Date().getTime(), msg: 'task upgraded' } } }, false);
                })
                .then(() => { });
        }
    });
}

function reportHandler(hpack: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const model = new TaskReportModel(hpack.reqbody);
        if (!model.valid) {
            hpack.status = 400;
            hpack.body = { errcode: 1 };
        }
        else {
            return db.task.getOne({ _id: model.objId }, { statusId: 1, lastProcessTs: 1 })
                .then((task: d.Task) => {
                    if (task == null) hpack.status = 404;
                    else {
                        if (task.statusId !== constant.task.status.processing && task.statusId !== constant.task.status.timeout) {
                            hpack.status = 400;
                            hpack.body = { errcode: 2, statusId: task.statusId };
                        }
                        else if (task.lastProcessTs !== model.processTs) {
                            hpack.status = 400;
                            hpack.body = { errcode: 3 };
                        }
                        else if (model.statusId === constant.task.status.success)
                            return db.task.updateAll({ _id: model.objId }, { $set: { statusId: constant.task.status.success, quickview: model.quickview }, $push: { processLog: { ts: new Date().getTime(), msg: 'task finished' } } }, false);
                        else {
                            const update: any = { $set: { statusId: constant.task.status.failed }, $push: { processLog: { ts: new Date().getTime(), msg: 'task failed', err: model.errmsg } } };
                            if (model.recoverable)
                                update['$inc'] = { 'constraints.ttl': 1 };
                            return db.task.updateAll({ _id: model.objId }, update, false);
                        }
                    }
                })
                .then(() => { });
        }
    });
}


const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('DISPATCH', dispatchHandler);
handlermap.set('RENEW', (hpack: utility.http.HttpPack) => statusIdUpdateHandler(hpack, constant.task.status.new, 'mark as renew'));
handlermap.set('MAKEREADY', (hpack: utility.http.HttpPack) => statusIdUpdateHandler(hpack, constant.task.status.prepared, 'mark as prepared'));
handlermap.set('CLOSE', closeHandler);
handlermap.set('UPGRADE', upgradeHandler);
handlermap.set('REPORT', reportHandler);
handlermap.set('GET', hutil.genGetOneHandler(db.task));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.task));
handlermap.set('GETALL', hutil.genGetAllHandler(db.task));
handlermap.set('CREATE', hutil.genCreateOneHandler(db.task, (httpbody: any) => new TaskCreateModel(httpbody)));
handlermap.set('CREATEMUL', hutil.genCreateMulHandler(db.task, (httpbody: any) => new TaskCreateModel(httpbody)));
