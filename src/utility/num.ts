
import * as validate from './validate';

export function frac(num: number, frac: number): number {
    const n = Math.pow(10, frac);
    return Math.round(num * n) / n;
}

export function numDiffLessThan(num1: number, num2: number, perc: number): boolean {
    if(!validate.posNum(num1) || !validate.posNum(num2) || !validate.nonNegNum(perc)) throw new Error('invalid input for numDiffLessThan');
    const up = 1 + perc, diff = Math.max(num1, num2) / Math.min(num1, num2);
    return diff <= up;
}
