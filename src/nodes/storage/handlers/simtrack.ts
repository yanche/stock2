
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
            log.error(`simtrack handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

function getOrCreateHandler(hpack: utility.http.HttpPack): bb<void> {
    return bb.resolve().then(() => {
        const filter = hpack.reqbody.filter, fields = hpack.reqbody.fields;
        if (!utility.validate.isObj(filter) || (fields != null && !utility.validate.isObj(fields)) || !utility.validate.valueStr(filter.target) || !utility.validate.valueStr(filter.rtplanId))
            hpack.status = 400;
        else return db.simtrack.findAndModify({ target: filter.target, rtplanId: filter.rtplanId }, { $unset: { ___rand: true } }, fields, true, true)
            .then(doc => {
                hpack.body = doc;
            })
    });
}

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
// handlermap.set('GETORCREATE', getOrCreateHandler);
handlermap.set('UPDATE', hutil.genUpdateAllHandler(db.simtrack, false));
handlermap.set('GETORCREATE', getOrCreateHandler);
