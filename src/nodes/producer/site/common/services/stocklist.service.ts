
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { StorageProxyService } from '../../common/services/storageproxy.service';

@Injectable()
export class StockListService {
    private _prmStockMap: Promise<Map<string, TargetInfo>>;
    private _prmIndexMap: Promise<Map<string, TargetInfo>>;
    constructor(private _storageproxy: StorageProxyService) { }

    public getStocks(): Promise<Map<string, TargetInfo>> {
        if (!this._prmStockMap) {
            this._prmStockMap = this._storageproxy.get<Array<TargetInfo>>(environment.containers.static, resources.allstocksJson)
                .then(data => {
                    const map = new Map<string, TargetInfo>();
                    for (let t of data) map.set(t.target, t);
                    return map;
                })
        }
        return this._prmStockMap;
    }

    public getIndexes(): Promise<Map<string, TargetInfo>> {
        if (!this._prmIndexMap) {
            this._prmIndexMap = this._storageproxy.get<Array<TargetInfo>>(environment.containers.static, resources.allindexesJson)
                .then(data => {
                    const map = new Map<string, TargetInfo>();
                    for (let t of data) map.set(t.target, t);
                    return map;
                })
        }
        return this._prmIndexMap;
    }
}

export interface TargetInfo {
    name: string;
    target: string;
    listDayTs: number;
}
