
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { UrlService } from './url.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class RequestService {
    constructor(private _http: Http, private _url: UrlService) { }

    getMul<T>(resource: string, page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object): Promise<GetMulReturn<T>> {
        return this._http.request(this._url.dispatcher(resource), {
            method: 'POST',
            headers: new Headers({ verb: 'GETMUL' }),
            search: `_ts=${new Date().getTime()}`,
            body: {
                page: page,
                pageSize: pageSize,
                filter: filter,
                fields: fields,
                orderby: orderby
            }
        }).toPromise().then(res => {
            if (res.status === 200) return res.json();
            else throw new Error(`get error ${res.status}, ${res.statusText} when calling GETMUL-${resource}`);
        });
    }
}

export interface GetMulReturn<T> {
    list: Array<T>;
    total: number;
    page: number;
    pageSize: number;
} 
