
import * as utility from '../../../utility';
import * as bb from 'bluebird';

export interface DispatcherHandler {
    (h: utility.http.HttpPack): bb<void>;
}

export interface HandlerDataModel {
    valid(): boolean;
    toMongoDoc(): any;
}

function objIdfy(obj: any): any {
    const ret: { [name: string]: any } = {};
    for (var i in obj) {
        ret[i] = (i === '_id') ? utility.mongo.objIdfy(obj[i]) : obj[i];
    }
    return ret;
}

export function genGetOneHandler<T>(colc: utility.mongo.CollClient<T>) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        const filter = <Object>body.filter || {}, fields = <Object>body.fields;
        if (!utility.validate.isObj(filter) || (fields != null && !utility.validate.isObj(fields))) {
            hpack.status = 400;
        }
        else {
            return colc.getOne(objIdfy(filter), fields)
                .then(data => {
                    if (data) hpack.body = data;
                    else hpack.status = 404;
                });
        }
    });
}

export function genGetMulHandler<T>(colc: utility.mongo.CollClient<T>) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        const page = <number>body.page, pageSize = <number>body.pageSize, filter = <Object>body.filter || {}, fields = <Object>body.fields, orderby = <Object>body.orderby || { _id: 1 };
        if (!utility.validate.posInt(page) || !utility.validate.posInt(pageSize) || !utility.validate.isObj(orderby) || !utility.validate.isObj(filter) || (fields != null && !utility.validate.isObj(fields))) {
            hpack.status = 400;
        }
        else {
            const _flt = objIdfy(filter);
            return bb.all([colc.getMul(_flt, fields, orderby, (page - 1) * pageSize, pageSize), colc.count(_flt)])
                .then(data => {
                    hpack.body = { list: data[0] || [], total: data[1], page: page, pageSize: pageSize };
                });
        }
    });
}

export function genGetAllHandler<T>(colc: utility.mongo.CollClient<T>) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        const filter = <Object>body.filter || {}, fields = <Object>body.fields, orderby = <Object>body.orderby || { _id: 1 };
        if (!utility.validate.isObj(orderby) || !utility.validate.isObj(filter) || (fields != null && !utility.validate.isObj(fields))) {
            hpack.status = 400;
        }
        else {
            return colc.getAll(objIdfy(filter), fields, orderby)
                .then(data => {
                    hpack.body = { list: data };
                });
        }
    });
}

export function genCreateOneHandler<T>(colc: utility.mongo.CollClient<T>, modelgen: (body: any) => HandlerDataModel) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const model = modelgen(hpack.reqbody);
        if (!model.valid()) {
            hpack.status = 400;
        }
        else {
            return colc.createOne(model.toMongoDoc())
                .then(id => {
                    hpack.body = { _id: id };
                });
        }
    });
}

export function genCreateMulHandler<T>(colc: utility.mongo.CollClient<T>, modelgen: (body: any) => HandlerDataModel) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        if (!Array.isArray(body.list) || body.list.length === 0) {
            hpack.body = { errcode: 1 };
            hpack.status = 400;
        }
        else {
            const erridx = new Array<number>(), models = new Array<HandlerDataModel>();
            for (var i = 0; i < body.list.length; ++i) {
                const model = modelgen(body.list[i]);
                if (model.valid()) models.push(model);
                else erridx.push(i);
            }
            if (erridx.length > 0) {
                hpack.status = 400;
                hpack.body = { errcode: 2, erridx: erridx };
            }
            else {
                return colc.bulkInsert(models.map(m => m.toMongoDoc()))
                    .then(ids => {
                        hpack.body = { list: ids.map(x => x.toString()) };
                    });
            }
        }
    });
}

export function genRemoveAllHandler<T>(colc: utility.mongo.CollClient<T>) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const filter = hpack.reqbody.filter || {};
        if (!utility.validate.isObj(filter)) {
            hpack.status = 400;
        }
        else {
            return colc.removeAll(objIdfy(filter))
                .then(ct => {
                    hpack.body = { removed: ct };
                });
        }
    });
}

export function genUpdateAllHandler<T>(colc: utility.mongo.CollClient<T>, upsert: boolean) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        const filter = body.filter || {}, update = body.update;
        if (!utility.validate.isObj(filter) || !utility.validate.isObj(update)) {
            hpack.status = 400;
        }
        else {
            return colc.updateAll(objIdfy(filter), update, upsert)
                .then(ret => {
                    hpack.body = { updated: ret.updated, insertedId: ret.insertedId };
                });
        }
    });
}

export function genBulkUpdateHandler<T>(colc: utility.mongo.CollClient<T>, upsert: boolean) {
    return (hpack: utility.http.HttpPack) => bb.resolve().then(() => {
        const body = hpack.reqbody;
        if (!Array.isArray(body.list) || body.list.length === 0) {
            hpack.status = 400;
            hpack.body = { errcode: 1 };
        }
        else {
            const erridx = new Array<number>(), updates = new Array<{ filter: any, update: any }>();
            for (var i = 0; i < body.list.length; ++i) {
                const item = body[i];
                if (!utility.validate.isObj(item.filter) || !utility.validate.isObj(item.update)) erridx.push(i);
                else updates.push({ filter: objIdfy(item.filter), update: item.update });
            }
            if (erridx.length > 0) {
                hpack.status = 400;
                hpack.body = { errcode: 2, erridx: erridx };
            }
            else {
                return colc.bulkUpdate(updates, upsert)
                    .then(() => {
                        hpack.body = '';
                    });
            }
        }
    });
}
