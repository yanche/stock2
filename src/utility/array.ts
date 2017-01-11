
export function findFirst<T>(arr: Array<T>, comparer: (t: T) => boolean, fallback: T): T {
    var len = arr.length;
    for (var i = 0; i < len; ++i) {
        var v = arr[i];
        if (comparer(v)) return v;
    }
    return fallback;
}

export function sum<T>(arr: Array<T>, fn: (t: T) => number): number {
    return arr.reduce((aggr, d) => aggr + fn(d), 0);
}

export function sum2(arr: Array<number>): number {
    return sum<number>(arr, n => n);
}

export function sub<T>(arr: Array<T>, fn: (t: T) => number): number {
    return arr.slice(1).reduce((aggr, d) => aggr - fn(d), fn(arr[0]));
}

export function sub2(arr: Array<number>): number {
    return sub<number>(arr, n => n);
}

export function mul<T>(arr: Array<T>, fn: (t: T) => number): number {
    return arr.reduce((aggr, d) => aggr * fn(d), 1);
}

export function mul2(arr: Array<number>): number {
    return mul<number>(arr, n => n);
}

export function div<T>(arr: Array<T>, fn: (t: T) => number): number {
    return arr.slice(1).reduce((aggr, d) => aggr / fn(d), fn(arr[0]));
}

export function div2(arr: Array<number>): number {
    return div<number>(arr, n => n);
}

export function min<T>(arr: Array<T>, fn: (t: T) => number): T {
    return selectOne<T, number>(arr, fn, (cur: number, min: number) => cur < min);
}

export function min2(arr: Array<number>): number {
    return min<number>(arr, n => n);
}

export function max<T>(arr: Array<T>, fn: (t: T) => number): T {
    return selectOne<T, number>(arr, fn, (cur: number, max: number) => cur > max);
}

export function max2(arr: Array<number>): number {
    return max<number>(arr, n => n);
}

export function selectOne<T, R>(arr: Array<T>, fn: (t: T) => R, cmp: (cur: R, sele: R) => boolean): T {
    if (arr.length == 0)
        throw new Error('utility:selectOne, bad input, array length could not be zero');
    var mval = fn(arr[0]), mobj = arr[0];
    for (var i = 1; i < arr.length; ++i) {
        var val = fn(arr[i]);
        if (cmp(val, mval)) {
            mobj = arr[i];
            mval = val;
        }
    }
    return mobj;
};

export function avg<T>(nums: Array<T>, mapfn: (t: T) => number): number {
    return nums.length === 0 ? 0 : (sum<T>(nums, mapfn) / nums.length);
}

export function avg2(nums: Array<number>): number {
    return avg<number>(nums, n => n);
}

export function geoMean<T>(nums: Array<T>, mapfn: (t: T) => number): number {
    return nums.length === 0 ? 1 : Math.pow(mul<T>(nums, mapfn), 1 / nums.length);
}

export function geoMean2(nums: Array<number>) {
    return geoMean<number>(nums, n => n);
}

export function unique<T>(arr: Array<T>): Array<T> {
    const ret = new Array<T>();
    for (let r of arr)
        if (ret.every(x => x !== r))
            ret.push(r);
    return ret;
}
