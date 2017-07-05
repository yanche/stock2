
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as bb from 'bluebird';
import * as db from '../db';
import * as hutil from './util';

export function handler(h: utility.http.HttpPack):bb<void> {
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
handlermap.set('GET', hutil.genGetOneHandler(db.rtprice));
handlermap.set('GETMUL', hutil.genGetMulHandler(db.rtprice));
handlermap.set('GETALL', hutil.genGetAllHandler(db.rtprice));
handlermap.set('REMOVE', hutil.genRemoveAllHandler(db.rtprice));
handlermap.set('UPSERT', hutil.genUpdateAllHandler(db.rtprice, true));
handlermap.set('BULKUPSERT', hutil.genBulkUpdateHandler(db.rtprice, true));