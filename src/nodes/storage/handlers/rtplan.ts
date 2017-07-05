
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';
import { verb } from "../../../const";

export function handler(h: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) {
            h.status = 404;
            log.error(`rtplan handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set(verb.GETONE, hutil.genGetOneHandler(db.rtplan));
handlermap.set(verb.GETMUL, hutil.genGetMulHandler(db.rtplan));
handlermap.set(verb.GETALL, hutil.genGetAllHandler(db.rtplan));
