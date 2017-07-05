
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
            log.error(`rtprice handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set(verb.GETONE, hutil.genGetOneHandler(db.rtprice));
handlermap.set(verb.GETMUL, hutil.genGetMulHandler(db.rtprice));
handlermap.set(verb.GETALL, hutil.genGetAllHandler(db.rtprice));
handlermap.set(verb.REMOVE, hutil.genRemoveAllHandler(db.rtprice));
handlermap.set(verb.UPSERT, hutil.genUpdateAllHandler(db.rtprice, true));
handlermap.set(verb.BULKUPSERT, hutil.genBulkUpdateHandler(db.rtprice, true));
