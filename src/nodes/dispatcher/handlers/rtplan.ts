
import * as utility from '../../../utility';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';

export function handler(h: utility.http.HttpPack) {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) return bb.reject(new Error(`rtplan handler not found for verb: ${verb}`));
        else return fn(h);
    });
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('GET', hutil.genGetOneHandler(db.rtplan));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.rtplan));
handlermap.set('GETALL', hutil.genGetAllHandler(db.rtplan));
