import { Pipe, PipeTransform } from '@angular/core';
import { RtpriceService } from '../services/rtprice.service';

@Pipe({ name: 'rtprice' })
export class RtpricePipe implements PipeTransform {
    constructor(private _rtprice: RtpriceService) { }

    transform(target: string, ref: string): number {
        const prices = <{ [key: string]: number }>((this._rtprice.map.get(target) || {}).prices || {});
        return prices[ref];
    }
}
