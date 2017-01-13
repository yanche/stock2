import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dts2datekey' })
export class Dts2DatekeyPipe implements PipeTransform {
    transform(dts: number): string {
        return moment.utc(dts * 60 * 60 * 24 * 1000).format('YYYYMMDD');
    }
}
