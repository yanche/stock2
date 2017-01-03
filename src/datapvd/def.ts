
import * as co from 'co';
import * as bb from 'bluebird';
import * as utility from '../utility';
import * as mods from '../mods';

interface DataPvdInput<T> {
    id: string;
    minTs: number;
    maxTs: number;
    hasdef: (dts: number) => boolean;
    gen: (dts: number, ctx?: DataGetterCtx) => T;
    remoteTs: (dts: number, n: number, forward: boolean) => number;
    weakdepts: Array<string>;
    genrtprog: () => utility.prog.Prog | string | number | boolean | Object;
}

export interface DataGetterCtx {
    sdts?: number;
    hdts?: number;
    ldts?: number;
    sp?: number;
    hp?: number;
    lp?: number;
}

export class DataPvd<T> {
    protected _id: string;
    protected _mints: number;
    protected _maxts: number;
    protected _hasdef: (dts: number) => boolean;
    protected _gen: (dts: number, ctx?: DataGetterCtx) => T;
    protected _remoteTs: (dts: number, n: number, forward: boolean) => number;
    protected _weakdepts: Array<string>;
    protected _genrtprog: () => utility.prog.Prog | string | number | boolean | Object;

    constructor(pack: DataPvdInput<T>) {
        if (!utility.validate.nonNegNum(pack.minTs, true) || !utility.validate.nonNegNum(pack.maxTs, true))
            throw new Error(`minTs or maxTs invalid, ${pack.minTs}, ${pack.maxTs}`);
        this._id = pack.id;
        this._maxts = pack.maxTs;
        this._mints = pack.minTs;
        //when _hasdef is called, no 'this' pointer will be passed
        this._hasdef = pack.hasdef;
        //when _gen is called, no 'this' pointer will be passed
        this._gen = pack.gen;
        //when _remoteTs is called, no 'this' pointer will be passed
        this._remoteTs = pack.remoteTs;
        this._weakdepts = pack.weakdepts;
        this._genrtprog = pack.genrtprog;
    }

    get minTs(): number { return this._mints; }
    get maxTs(): number { return this._maxts; }
    get id(): string { return this._id; }
    get weakdepts(): Array<string> { return this._weakdepts; }
    get remoteTs_core(): (ts: number, n: number, forward: boolean) => number { return this._remoteTs; }
    get hasDef_core(): (ts: number) => boolean { return this._hasdef; }
    get gen_core(): (ts: number) => T { return this._gen; }
    hasDef(dts: number): boolean {
        return dts >= this._mints && dts <= this._maxts && this._hasdef.call(null, dts);
    }
    forwardTs(dts: number, n: number): number {
        const retts = this._remoteTs.call(null, dts, n, true);
        return (retts != null && retts >= this._mints && retts <= this._maxts) ? retts : null;
    }
    backwardTs(dts: number, n: number): number {
        const retts = this._remoteTs.call(null, dts, n, false);
        return (retts != null && retts >= this._mints && retts <= this._maxts) ? retts : null;
    }
    periodTs(mints: number, maxts: number): Array<number> {
        mints = this.forwardTs(mints, 0);
        maxts = this.backwardTs(maxts, 0);
        if (this.hasDef(mints) && this.hasDef(maxts)) {
            let ts = mints, ret = new Array<number>();
            while (ts != null && ts <= maxts) {
                ret.push(ts);
                ts = this.forwardTs(ts, 1);
            }
            return ret;
        }
        else throw new Error(`input for periodTs is out of defined area, ${utility.date.dateTs2DateKey(mints)}, ${utility.date.dateTs2DateKey(maxts)}, ${this.id} from ${utility.date.dateTs2DateKey(this.minTs)} to ${utility.date.dateTs2DateKey(this.maxTs)}`);
    }
    period(mints: number, maxts: number): Array<{ val: T, ts: number }> {
        return this.periodTs(mints, maxts).map(dts => { return { ts: dts, val: <T>this._gen.call(null, dts, null) }; });
    }
    get(dts: number, ctx?: DataGetterCtx): T {
        if (this.hasDef(dts)) return this._gen.call(null, dts, ctx);
        else throw new Error(`input for get is out of defined area, ${utility.date.dateTs2DateKey(dts)}, ${this.id} from ${utility.date.dateTs2DateKey(this.minTs)} to ${utility.date.dateTs2DateKey(this.maxTs)}`);
    }
    cached(dts: number): boolean { return false; }
    getRTProg(): utility.prog.Prog | string | number | boolean | Object {
        return this._genrtprog();
    }
}

export class StoredDataPvd<T> extends DataPvd<T> {
    protected _cache: Map<number, T>;

    constructor(pack: DataPvdInput<T>) {
        super(pack);
        this._cache = new Map<number, T>();
    }
    get(dts: number, ctx?: DataGetterCtx): T {
        if (!this.hasDef(dts)) throw new Error(`input for get is out of defined area, ${dts}`);
        if (this._cache.has(dts)) {
            return this._cache.get(dts);
        }
        else {
            const v = <T>this._gen.call(null, dts, ctx);
            this._cache.set(dts, v);
            return v;
        }
    }
    cached(dts: number): boolean { return this._cache.has(dts); }
}

export class IterDataPvd<T> extends StoredDataPvd<T> {
    private _iterUB: number;

    constructor(pack: DataPvdInput<T>) {
        super(pack);
        this._iterUB = this.minTs;
    }

    get(dts: number, ctx?: DataGetterCtx): T {
        if (!this.hasDef(dts)) throw new Error(`input for get is out of defined area, ${dts}`);
        let iterts = this._iterUB;
        while (iterts != null && iterts <= dts) {
            this._cache.set(iterts, <T>this._gen.call(null, iterts, ctx));
            iterts = this.forwardTs(iterts, 1);
        }
        this._iterUB = iterts;
        return this._cache.get(dts);
    }
}
