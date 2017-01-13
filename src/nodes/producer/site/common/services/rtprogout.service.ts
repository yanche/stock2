
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from './request.service';

@Injectable()
export class RtprogoutService {
    constructor(private _req: RequestService) { }

    getAll(filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getAll<Rtprogout>('rtprogout', filter, fields, orderby);
    }
}

export interface Rtprogout {
    _id?: string;
    rtplanId?: string;
    target?: string;
    rtprog?: Object;
    glong?: boolean;
    createdTs?: number;
    sdts?: number;
    sp?: number;
    hdts?: number;
    hp?: number;
    ldts?: number;
    lp?: number;
    hit?: boolean;
    hitUpdateTs?: number;
}
