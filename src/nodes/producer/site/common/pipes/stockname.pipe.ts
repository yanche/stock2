import { Pipe, PipeTransform } from '@angular/core';
import { StockListService, TargetInfo } from '../services/stocklist.service';

@Pipe({ name: 'stockname' })
export class StockNamePipe implements PipeTransform {
    private _stockMap: Map<string, TargetInfo>;
    private _indexMap: Map<string, TargetInfo>;
    constructor(private _stocklist: StockListService) {
        _stocklist.getStocks().then(map => this._stockMap = map);
        _stocklist.getIndexes().then(map => this._indexMap = map);
    }

    private _tryGetName(target: string, map: Map<string, TargetInfo>) {
        if (map) {
            const info = map.get(target);
            return info ? info.name : '';
        }
        else return '';
    }

    transform(target: string): string {
        return this._tryGetName(target, this._stockMap) || this._tryGetName(target, this._indexMap) || '';
    }
}
