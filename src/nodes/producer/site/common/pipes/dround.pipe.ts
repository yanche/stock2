import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dround' })
export class DroundPipe implements PipeTransform {
    transform(num: number): number {
        return Math.round(num * 10000) / 10000;
    }
}
