import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'frac' })
export class FracPipe implements PipeTransform {
    transform(num: number, frac: number): number {
        const n = Math.pow(10, frac);
        return Math.round(num * n) / n;
    }
}
