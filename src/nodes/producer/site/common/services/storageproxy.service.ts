
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { UrlService } from './url.service';
import { ConstService } from './const.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class StorageProxyService {
    constructor(private _http: Http, private _url: UrlService, private _const: ConstService) { }

    get<T>(container: string, path: string) {
        return this._http.request(this._url.dispatcher('storageproxy'), {
            method: this._const.http.post,
            headers: new Headers({ verb: 'GET' }),
            search: `_ts=${new Date().getTime()}`,
            body: {
                storage: 'azure',
                container: container,
                path: path
            }
        }).toPromise().then(res => {
            if (res.status === 200) return <T>res.json();
            else throw new Error(`get error ${res.status}, ${res.statusText} when calling storageproxy-GET}`);
        });
    }
}
