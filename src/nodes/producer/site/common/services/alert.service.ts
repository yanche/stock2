
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from './request.service';

@Injectable()
export class AlertService {
    constructor(private _req: RequestService) { }

    getMul(page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getMul<Alert>('alert', page, pageSize, filter, fields, orderby);
    }
}

@Injectable()
export class AlertPlanService {
    constructor(private _req: RequestService) { }

    getAll(filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getAll<AlertPlan>('alertplan', filter, fields, orderby);
    }
}

export interface Alert {
    _id?: string;
    simulateId?: string;
    target?: string;
    alertPlanId?: string;
    new?: boolean;
    createdTs?: number;
}

export interface AlertPlan {
    _id?: string;
    name?: string;
    desc?: string;
    rtplanId?: string;
    prog?: Object;
}
