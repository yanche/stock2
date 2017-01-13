
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from './request.service';

@Injectable()
export class RtplanService {
    constructor(private _req: RequestService) { }

    getAll(filter: Object, fields?: Object, orderby?: Object) {
        return this._req.getAll<Rtplan>('rtplan', filter, fields, orderby);
    }
}

export interface Rtplan {
    _id?: string;
    targetScope?: { type?: string, pack?: any },
    cpdefRef?: Object,
    cpoutdefRef?: Object,
    createdTs?: number,
    comments?: Object, //structured
    name?: string,
    doc?: Object,
    lookback?: Object, //回测数据
    glong?: boolean,
    startDateTs?: number,
    runrt?: boolean,
    concerns?: { in?: Array<RtplanConcern>, out?: Array<RtplanConcern> },
}

export interface RtplanConcern {
    name: string;
    view: string;
    dpRef: Object;
}
