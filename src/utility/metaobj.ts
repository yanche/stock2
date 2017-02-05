
import * as validate from './validate';

export function replace(input: any, map: Map<string, any> | { [key: string]: any }, exempts?: Array<string>) {
    const map2 = new Map<string, MapItem>();
    if (map instanceof Map) {
        for (let m of map) {
            map2.set(m[0], { mapTo: m[1], accessType: MapItemAccessType.never });
        }
    }
    else {
        for (let key in map) {
            map2.set(key, { mapTo: map[key], accessType: MapItemAccessType.never });
        }
    }
    return _metaReplace(input, map2, exempts || []);
}

function _resolveMap(ref: string, map: Map<string, MapItem>, exempts: Array<string>) {
    if (exempts.some(e => e === ref)) return `{{${ref}}}`;
    if (!map.has(ref)) throw new Error(`${ref} not in map`);
    const mapitem = map.get(ref);
    if (mapitem.accessType === MapItemAccessType.processing) throw new Error(`cycle reference: ${ref}`);
    else if (mapitem.accessType === MapItemAccessType.processed) return mapitem.mapTo;
    else {
        mapitem.accessType = MapItemAccessType.processing;
        mapitem.mapTo = _metaReplace(mapitem.mapTo, map, exempts);
        mapitem.accessType = MapItemAccessType.processed;
        return mapitem.mapTo;
    }
}

function _metaReplace(input: any, map: Map<string, MapItem>, exempts: Array<string>): any {
    if (validate.isStr(input)) {
        const ref = strRef(input);
        if (ref == null) {
            return input;
        }
        else {
            return _resolveMap(ref, map, exempts);
        }
    }
    else if (Array.isArray(input)) {
        return input.map(o => _metaReplace(o, map, exempts));
    }
    else if (validate.isObj(input)) {
        const ret: { [key: string]: any } = {};
        for (let i in input) {
            ret[i] = _metaReplace(input[i], map, exempts);
        }
        return ret;
    }
    else return input;
}

interface MapItem {
    mapTo: any;
    accessType: MapItemAccessType;
}

enum MapItemAccessType {
    never,
    processing,
    processed
}

function strRef(str: string): string {
    str = str.trim();
    if (str.length < 4) return null;
    else if (str.slice(0, 2) === '{{' && str.slice(-2) === '}}') return str.slice(2, -2);
    else return null;
}
