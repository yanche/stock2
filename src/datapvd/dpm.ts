
import * as utility from '../utility';
import * as config from '../config';
import * as bb from 'bluebird';
import * as def from './def';
import * as datadef from '../datadef';
import * as datasrc from '../datasrc';
import Hub from "prmhub";

interface RawDataSlice2 extends datadef.RawDataSlice {
    _datets: number;
    _idx: number;
}

export function getRawData(target: string): Promise<RawDataAggr> {
    return retrieve(target).rawHub.get();
}

export function cachedTargets(): Array<string> {
    return srcCache.map(c => c.target);
}

/**
 * targets: target list to remove
 */
export function clearCache(targets: Array<string>): void {
    srcCache = targets == null ? [] : srcCache.filter(c => targets.every(t => t !== c.target));
}

export function getDPCache(target: string): bb<Map<string, Hub<def.DataPvd<any>>>> {
    return bb.resolve().then(() => getRawData(target))
        .then(r => r.dpCache);
}

class RawDataAggr {
    private _rawarr: Array<RawDataSlice2>; //at least one
    private _rawmap: Map<number, RawDataSlice2>;
    private _dpCache: Map<string, Hub<def.DataPvd<any>>>;

    public get dpCache(): Map<string, Hub<def.DataPvd<any>>> {
        return this._dpCache;
    }

    public hasDef(dts: number): boolean {
        return this._rawmap.has(dts);
    }

    public get(dts: number): datadef.RawDataSlice {
        return this._rawmap.get(dts);
    }

    public rawData(datets: number): datadef.RawDataSlice {
        return this._rawmap.get(datets);
    }

    public get minDateTs(): number {
        return this._rawarr[0]._datets;
    }

    public get maxDateTs(): number {
        return this._rawarr[this._rawarr.length - 1]._datets;
    }

    public forwardDts(datets: number, n: number): number {
        if (utility.validate.nonNegNum(n, true)) {
            const nearestDateTs = this._findClosestDts(datets, true);
            if (nearestDateTs == null) return null;
            else if (n === 0) return nearestDateTs;
            else {
                const ridx = this._rawmap.get(nearestDateTs)._idx + n;
                return ridx >= this._rawarr.length ? null : this._rawarr[ridx]._datets;
            }
        }
        else throw new Error(`only integer >= 0 is acceptable, ${n}`);
    }

    public backwardDts(datets: number, n: number): number {
        if (utility.validate.nonNegNum(n, true)) {
            const nearestDateTs = this._findClosestDts(datets, false);
            if (nearestDateTs == null) return null;
            else if (n === 0) return nearestDateTs;
            else {
                const ridx = this._rawmap.get(nearestDateTs)._idx - n;
                return ridx < 0 ? null : this._rawarr[ridx]._datets;
            }
        }
        else throw new Error(`only integer >= 0 is acceptable, ${n}`);
    }

    private _findClosestDtsRecur(dts: number, next: boolean, s: number, e: number): number {
        if (s > e) throw new Error('impossible code path, defensive exception');;
        const mid = Math.floor((s + e) / 2);
        const midv = this._rawarr[mid];
        if (next) {
            if (midv._datets < dts) return this._findClosestDtsRecur(dts, next, mid + 1, e);
            else if (this._rawarr[mid - 1]._datets < dts) return midv._datets;
            else return this._findClosestDtsRecur(dts, next, s, mid - 1);
        }
        else {
            if (midv._datets > dts) return this._findClosestDtsRecur(dts, next, s, mid - 1);
            else if (this._rawarr[mid + 1]._datets > dts) return midv._datets;
            else return this._findClosestDtsRecur(dts, next, mid + 1, e);
        }
    }
    //return null for not matched
    private _findClosestDts(dts: number, next: boolean): number {
        if (this._rawmap.has(dts)) return dts;
        else {
            const mindts = this._rawarr[0]._datets, maxdts = this._rawarr[this._rawarr.length - 1]._datets;
            if (next) {
                if (dts > maxdts) return null;
                if (dts < mindts) return mindts;
            }
            else {
                if (dts > maxdts) return maxdts;
                if (dts < mindts) return null;
            }
            return this._findClosestDtsRecur(dts, next, 0, this._rawarr.length - 1);
        }
    }

    constructor(rawarr: Array<RawDataSlice2>, rawmap: Map<number, RawDataSlice2>) {
        this._rawarr = rawarr;
        this._rawmap = rawmap;
        this._dpCache = new Map<string, Hub<def.DataPvd<any>>>();
    }
}

interface CachedItem {
    target: string,
    rawHub: Hub<RawDataAggr>,
    permanent: boolean,
    lastAccessTs: number
}
let srcCache = new Array<CachedItem>();

function genRawDataHub(target: string): Hub<RawDataAggr> {
    return new Hub<RawDataAggr>(() => {
        let fname = `${target}.json`;
        return datasrc.mine.targetData.get2(target)
            .then(rawdata => {
                if (rawdata == null) throw new Error(`failed to load raw-data from ${config.useLocalRaw ? 'local folder' : 'azure storage'}`);
                let minTs = utility.date.dateKey2DateTs(rawdata.minDay), maxTs = utility.date.dateKey2DateTs(rawdata.maxDay);
                let rawarr = new Array<RawDataSlice2>(), datamap = rawdata.data, mintshit = false, maxtshit = false, rawmap = new Map<number, RawDataSlice2>();
                for (let d in datamap) {
                    let ds = <RawDataSlice2>datamap[d], ts = utility.date.dateKey2DateTs(d);
                    if (ts < minTs || ts > maxTs) throw new Error(`data ts exceeds the range of min-max ts, ${d}, ${rawdata.minDay}, ${rawdata.maxDay}`);
                    if (ts === minTs) mintshit = true;
                    if (ts === maxTs) maxtshit = true;
                    ds._datets = ts;
                    rawarr.push(ds);
                    rawmap.set(ts, ds);
                }
                if (!mintshit) throw new Error(`no data found for minTs, ${rawdata.minDay}, ${target}`);
                if (!maxtshit) throw new Error(`no data found for maxTs, ${rawdata.maxDay}, ${target}`);
                rawarr.sort((v1, v2) => v1._datets - v2._datets);
                for (let i = 0; i < rawarr.length; ++i) rawarr[i]._idx = i;
                return new RawDataAggr(rawarr, rawmap);
            });
    }, config.rawDataExpiryInMS);
}

function retrieve(target: string): CachedItem {
    let incache = findCache(target);
    if (incache != null) {
        incache.lastAccessTs = new Date().getTime();
        return incache;
    }
    else {
        let src: CachedItem = { target: target, rawHub: genRawDataHub(target), lastAccessTs: new Date().getTime(), permanent: targetPermanentCached(target) };
        if (src.permanent || weakCacheCount() < config.maxRawDataCached) {
            srcCache.push(src);
        }
        else {
            let withMinTs = utility.array.min(srcCache.filter(c => !c.permanent), c => c.lastAccessTs);
            srcCache = srcCache.filter(c => c !== withMinTs);
            srcCache.push(src);
            console.log(`${withMinTs.target} removed from dpm cache, now: ${srcCache.length} left`);
        }
        return src;
    }
}

function findCache(target: string): CachedItem {
    return utility.array.findFirst(srcCache, x => x.target === target, null);
}

function weakCacheCount() {
    return utility.array.sum(srcCache, c => c.permanent ? 0 : 1);
};

function targetPermanentCached(target: string): boolean {
    let t = target.toUpperCase();
    return config.maintainIdx.some(s => t === s);
};
