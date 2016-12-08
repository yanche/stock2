
export function frac(num: number, frac: number): number{
    const n = Math.pow(10, frac);
    return Math.round(num * n) / n;
}
