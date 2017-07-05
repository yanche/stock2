
import * as utility from '../../utility';
import * as config from '../../config';
import * as bb from 'bluebird';
import * as co from 'co';
import * as _ from 'lodash';

function durl(resx: string) {
    return '/' + resx.trim();
}

export function expectJson<T>(method: string, resx: string, body: Object | Buffer | Array<any> | string, retry: number, headers: { [name: string]: any }): bb<T> {
    return expectRaw(method, resx, body, retry, headers)
        .then(bytes => {
            try {
                return JSON.parse(bytes.toString('utf8'));
            }
            catch (err) {
                throw new Error('failed to parse returned data to json');
            }
        })
}

export function expectRaw(method: string, resx: string, body: Object | Buffer | Array<any> | string, retry: number, headers: { [name: string]: any }): bb<Buffer> {
    return req(method, resx, body, retry, headers)
        .then(reply => {
            if (reply.statusCode === 200) return reply.data;
            else throw new Error(`return statuscode not 200: ${reply.statusCode}`);
        })
}

export function req(method: string, resx: string, body: Object | Buffer | Array<any> | string, retry: number, headers: { [name: string]: any }): bb<utility.http.WebReqReturn> {
    return utility.http.webreq({
        method: method,
        headers: headers,
        path: durl(resx),
        host: config.storageHost,
        port: config.storagePort,
        retry: retry
    }, body, false);
}

export function genGetAll<T>(resx: string) {
    return function (filter: Object, fields?: Object, orderby?: Object) {
        return expectJson<{ list: Array<T> }>('POST', resx, { filter: filter, fields: fields, orderby: orderby }, 1, { verb: 'GETALL' }).then(d => d.list);
    }
}

export function genGetMul<T>(resx: string) {
    return function (filter: Object, page: number, pageSize: number, fields?: Object, orderby?: Object) {
        return expectJson<{ list: Array<T>, page: number, pageSize: number, total: number }>('POST', resx, { filter: filter, fields: fields, page: page, pageSize: pageSize, orderby: orderby }, 1, { verb: 'GETMUL' });
    }
}

export function genGetOne<T>(resx: string) {
    return function (filter: Object, fields?: Object, orderby?: Object) {
        return expectJson<T>('POST', resx, { filter: filter, fields: fields, orderby: orderby }, 1, { verb: 'GET' });
    }
}

export function genRemove(resx: string) {
    return function (filter: Object) {
        return expectJson<{ removed: number }>('POST', resx, { filter: filter }, 0, { verb: 'REMOVE' });
    }
}

export function genUpdate(resx: string) {
    return function (filter: Object, update: Object) {
        return expectJson<{ updated: number }>('POST', resx, { filter: filter, update: update }, 0, { verb: 'UPDATE' });
    }
}

export function genUpsert(resx: string) {
    return function (filter: Object, update: Object) {
        return expectJson<{ insertedId: string, updated: number }>('POST', resx, { filter: filter, update: update }, 0, { verb: 'UPSERT' });
    }
}

export function genBulkUpdate(resx: string, upsert: boolean, pagesize: number) {
    if (!utility.validate.posInt(pagesize))
        throw new Error('only positive integer is acceptable');
    return function (list: Array<{ filter: Object, update: Object }>) {
        return new bb((res, rej) => {
            co(function* (): any {
                if (list.length === 0) return;
                const maxidx = Math.floor((list.length - 1) / pagesize);
                for (var i = 0; i <= maxidx; ++i) {
                    yield expectRaw('POST', resx, { list: list.slice(i * pagesize, (i + 1) * pagesize) }, 0, { verb: upsert ? 'BULKUPSERT' : 'BULKUPDATE' });
                }
            }).then(() => { res(null); }, rej);
        });
    }
}

export function genCreate<T>(resx: string) {
    return function (data: T) {
        return expectJson<{ _id: string }>('POST', resx, data, 0, { verb: 'CREATE' });
    }
}

export function genCreateMul<T>(resx: string, pagesize: number) {
    if (!utility.validate.posInt(pagesize))
        throw new Error('only positive integer is acceptable');
    return function (list: Array<T>): bb<{ list: Array<string> }> {
        return new bb<{ list: Array<string> }>((res, rej) => {
            const ret = new Array<Array<string>>();
            co(function* (): any {
                if (list.length === 0) return;
                const maxidx = Math.floor((list.length - 1) / pagesize);
                for (var i = 0; i <= maxidx; ++i) {
                    const x: { list: Array<string> } = yield expectJson<{ list: Array<string> }>('POST', resx, { list: list.slice(i * pagesize, (i + 1) * pagesize) }, 0, { verb: 'CREATEMUL' });
                    ret.push(x.list);
                }
            }).then(() => {
                res({ list: _.flatten(ret) });
            }, rej);
        });
    }
}
