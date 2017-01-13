
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from '../../common/services/request.service';

@Injectable()
export class RtpriceService {
    constructor(private _req: RequestService) {
        this._loadOnce = false;
        this.map = new Map<string, Rtprice>();
        this._loadNewPrices();
    }

    public map: Map<string, Rtprice>;

    private _loadOnce: boolean;
    private _loadNewPrices() {
        if (!this._loadOnce || rtLoadingTime()) {
            this._getAll()
                .then(data => {
                    for (let d of data.list) {
                        this.map.set(d._id, d);
                    }
                })
                .catch(err => console.error(err))
                .then(() => {
                    this._loadOnce = true;
                    setTimeout(() => this._loadNewPrices, 5000);
                });
        }
        else {
            setTimeout(() => this._loadNewPrices, 5000);
        }
    }

    private _getAll(filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getAll<Rtprice>('rtprice', filter, fields, orderby);
    }
}

export interface Rtprice {
    _id?: string,
    lastEnd?: number,
    lastDts?: number,
    lastEndUpdateTs?: number,
    adjprices?: {
        p?: number,
        s?: number,
        e?: number,
        l?: number,
        h?: number,
        v?: number,
        ex?: number,
        nr?: number,
        mv?: number
    },
    prices?: {
        p?: number,
        s?: number,
        e?: number,
        l?: number,
        h?: number,
        v?: number,
        ex?: number,
        nr?: number,
        mv?: number
    },
    priceUpdateTs?: number,
}

export function rtLoadingTime() {
    const now = new Date();
    const day = now.getDay();
    if (day == 0 || day == 6)
        return false; //not on weekends
    const ub = new Date();
    ub.setUTCHours(7); //15:00 China time
    ub.setUTCMinutes(0);
    ub.setUTCSeconds(0);
    ub.setUTCMilliseconds(0);
    const lb = new Date();
    lb.setUTCHours(1); //9:30 China time
    lb.setUTCMinutes(30);
    lb.setUTCSeconds(0);
    lb.setUTCMilliseconds(0);
    const nowts = now.getTime();
    return nowts >= lb.getTime() && nowts <= ub.getTime();
}
