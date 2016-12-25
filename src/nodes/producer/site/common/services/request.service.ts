
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptionsArgs } from '@angular/http';
import { UrlService } from './url.service';
import { ConstService } from './const.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class RequestService {
    constructor(private _http: Http, private _url: UrlService, private _const: ConstService) { }

    getMul<T>(resource: string, page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object): Promise<GetMulReturn<T>> {
        return this._reqJson<GetMulReturn<T>>(resource, 'GETMUL', {
            page: page,
            pageSize: pageSize,
            filter: filter,
            fields: fields,
            orderby: orderby
        });
    }

    create<Ti>(resource: string, data: Ti): Promise<{ _id: string }> {
        return this._reqJson<{ _id: string }>(resource, 'CREATE', data);
    }

    createMul<Ti>(resource: string, data: Array<Ti>): Promise<{ list: Array<string> }> {
        return this._reqJson<{ list: Array<string> }>(resource, 'CREATEMUL', { list: data });
    }

    private _reqJson<T>(resource: string, verb: string, body: any) {
        return this._http.request(this._url.dispatcher(resource), {
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
