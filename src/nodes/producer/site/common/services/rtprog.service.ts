
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from './request.service';

@Injectable()
export class RtprogService {
    constructor(private _req: RequestService) { }

    getAll(filter: Object, fields?: Object, orderby?: Object) {
        return this._req.getAll<Rtprog>('rtprog', filter, fields, orderby);
    }
}

export interface Rtprog {
    _id?: string;
    rtplanId?: string;
    target?: string;
    rtprog?: Object;
    glong?: boolean;
    createdTs?: number;
    hit?: boolean;
    hitUpdateTs?: number;
}
