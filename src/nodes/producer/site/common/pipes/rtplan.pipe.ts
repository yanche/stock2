import { Pipe, PipeTransform } from '@angular/core';
import { Rtplan, RtplanService } from '../services/rtplan.service';

@Pipe({ name: 'rtplan' })
export class RtplanPipe implements PipeTransform {
    private _rtplanMap: Map<string, Rtplan>;
    constructor(private _rtplan: RtplanService) {
        this._rtplanMap = new Map<string, Rtplan>();
        _rtplan.getAll({}).then(data => {
            for (let r of data.list) {
                this._rtplanMap.set(r._id, r);
            }
        });
    }

    transform(id: string): Rtplan {
        return this._rtplanMap.get(id);
    }
}
