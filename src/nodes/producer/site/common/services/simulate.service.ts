
import { Injectable } from '@angular/core';
import { RequestService } from './request.service';

@Injectable()
export class SimulateService {
    constructor(private _req: RequestService) { }

    getMul(page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getMul<Simulate>('simulate', page, pageSize, filter, fields, orderby);
    }
}

export interface Simulate {
    _id?: string;
    closed?: boolean;
    target?: string;
    sdts?: number;
    sp?: number;
    edts?: number;
    ep?: number;
    hdts?: number;
    hp?: number;
    ldts?: number;
    lp?: number;
    glong?: boolean;
    rtplanId?: string;
    env?: Array<{ target: string, sp: number, ep: number }>;
    concernsIn?: Array<Object>;
    concernsOut?: Array<Object>;
}
