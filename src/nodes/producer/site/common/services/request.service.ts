
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptionsArgs } from '@angular/http';
import { UrlService } from './url.service';
import { ConstService } from './const.service';
import { UtilityService } from './utility.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class RequestService {
    constructor(private _http: Http, private _url: UrlService, private _const: ConstService, private _utility: UtilityService) { }

    getMul<T>(resource: string, page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object): Promise<GetMulReturn<T>> {
        return this._reqJson<GetMulReturn<T>>(resource, verb.GETMUL, {
            page: page,
            pageSize: pageSize,
            filter: filter,
            fields: fields,
            orderby: orderby
        });
    }

    getAll<T>(resource: string, filter?: Object, fields?: Object, orderby?: Object): Promise<GetAllReturn<T>> {
        return this._reqJson<GetAllReturn<T>>(resource, verb.GETALL, {
            filter: filter,
            fields: fields,
            orderby: orderby
        });
    }

    create<Ti>(resource: string, data: Ti): Promise<{ _id: string }> {
        return this._reqJson<{ _id: string }>(resource, verb.CREATEONE, data);
    }

    createMul<Ti>(resource: string, data: Array<Ti>): Promise<{ list: Array<string> }> {
        let startIdx = 0, ret: Array<Array<string>> = [];
        return this._utility.whileLoop(() => Promise.resolve(startIdx < data.length), () => {
            const endIdx = startIdx + 200;
            return this._reqJson<{ list: Array<string> }>(resource, verb.CREATEMUL, { list: data.slice(startIdx, endIdx) })
                .then(r => {
                    startIdx = endIdx;
                    ret.push(r.list);
                });
        })
            .then(() => {
                return { list: Array.prototype.concat.apply([], ret) };
            })

    }

    private _reqJson<T>(resource: string, verb: string, body: any) {
        return this._http.request(resource === "task" ? this._url.dispatcher() : this._url.storage(resource), {
            method: this._const.http.post,
            headers: new Headers({ verb: verb.toUpperCase() }),
            search: `_ts=${new Date().getTime()}`,
            body: body
        }).toPromise().then(res => {
            if (res.status === 200) return <T>res.json();
            else throw new Error(`get error ${res.status}, ${res.statusText} when calling ${resource}-${verb.toUpperCase()}`);
        });
    }

}

export interface GetMulReturn<T> {
    list: Array<T>;
    total: number;
    page: number;
    pageSize: number;
}

export interface GetAllReturn<T> {
    list: Array<T>;
}
