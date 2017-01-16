
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { RequestService } from '../../common/services/request.service';
import { Hub } from '../../common/services/utility.service';

@Injectable()
export class RtpriceService {
    private _hub: Hub<Map<string, Rtprice>>

    constructor(private _req: RequestService) {
        this._hub = new Hub<Map<string, Rtprice>>(() => {
            return this._req.getAll<Rtprice>('rtprice', {})
                .then(data => {
                    const map = new Map<string, Rtprice>();
                    for (let d of data.list) {
                        map.set(d._id, d);
                    }
                    return map;
                });
        }, 5000);
    }

    public getAll(): Promise<Map<string, Rtprice>> {
        return this._hub.get();
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
