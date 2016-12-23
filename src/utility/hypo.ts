
import * as utility from './index';

export interface PEnum {
    [key: string]: Array<string | number | boolean> | string | number | boolean | PEnum
}

export function isPEnum(p: any): p is PEnum {
    if (!utility.validate.isObj(p)) return false;
    for (let k in p) {
        const m = p[k];
        if (utility.validate.isStr(k) &&
            (
                (Array.isArray(m) && m.length > 0 && m.every(a => utility.validate.isStr(a) || utility.validate.isBool(a) || utility.validate.isNum(a)))
                || utility.validate.isStr(m)
                || utility.validate.isNum(m)
                || utility.validate.isBool(m)
                || isPEnum(m)
            )
        ) continue;
        else return false;
    }
    return true;
}

abstract class Enumerator {
    public abstract current(): any;
    public abstract end(): boolean;
    public abstract next(): void;
    public abstract total(): number;
    public abstract init(): void;
}

export class ArrayEnumerator extends Enumerator {
    private _arr: Array<any>;
    private _idx: number;

    public current(): any {
        return this._arr[this._idx];
    }
    public end(): boolean {
        return this._arr.length === this._idx - 1;
    }
    public next(): void {
        if (this.end()) throw new Error('ArrayEnumerator:next, cannot move next because end reached')
        else this._idx++;
    }
    public total(): number {
        return this._arr.length;
    }
    public init(): void {
        this._idx = 0;
    }

    constructor(arr: Array<any>) {
        super();
        if (arr.length === 0) throw new Error('empty array is not acceptable');
        this._arr = arr.slice(0); //clone
        this._idx = 0;
    }
}

export class MapEnumerator extends Enumerator {
    private _map: { [key: string]: Enumerator } = {};
    private _t: number;

    public current(): { [key: string]: any } {
        const ret: { [key: string]: any } = {};
        for (let i in this._map) {
            ret[i] = this._map[i].current();
        }
        return ret;
    }
    public end(): boolean {
        for (let i in this._map) {
            if (!this._map[i].end())
                return false;
        }
        return true;
    }
    public next(): void {
        if (this.end()) throw new Error('cannot move next because end reached');
        else {
            for (let i in this._map) {
                const e = this._map[i];
                if (!e.end()) {
                    e.next();
                    return;
                }
                else
                    e.init();
            }
            throw new Error('impossible code path');
        }
    }
    public total(): number {
        if (this._t != null) return this._t;
        else {
            let s = 1;
            for (let i in this._map) {
                s *= this._map[i].total();
            }
            this._t = s;
            return s;
        }
    }
    public init(): void {
        for (let i in this._map) this._map[i].init();
    }

    constructor(map: PEnum) {
        super();
        for (let i in map) {
            const v = map[i];
            if (Array.isArray(v))
                this._map[i] = new ArrayEnumerator(v);
            else if (utility.validate.isObj(v))
                this._map[i] = new MapEnumerator(<PEnum>v);
            else
                this._map[i] = new ArrayEnumerator([v]);
        }
        this._t = null;
    }
}
