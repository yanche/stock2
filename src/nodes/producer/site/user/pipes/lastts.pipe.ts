import { Pipe, PipeTransform } from '@angular/core';
import { RtpriceService } from '../services/rtprice.service';

@Pipe({ name: 'lastdts' })
export class LastDtsPipe implements PipeTransform {
    constructor(private _rtprice: RtpriceService) {    }

    transform(target: string): number {
        return (this._rtprice.map.get(target) || {}).lastDts;
    }
}
