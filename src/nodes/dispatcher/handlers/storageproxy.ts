
import * as utility from '../../../utility';
import * as log from '../../../log';
import * as bb from 'bluebird';
import * as filestorage from '../../../filestorage';

export function handler(h: utility.http.HttpPack):bb<void> {
    return bb.resolve().then(() => {
        const verb = (h.getReqHeader('verb') || '').toUpperCase();
        const fn = handlermap.get(verb);
        if (fn == null) {
            h.status = 404;
            log.error(`storageproxy handler not found for verb: ${verb}`);
        }
        else return fn(h);
    });
}

function getHandler(h: utility.http.HttpPack) {
    return bb.resolve()
        .then(() => {
            const body = <BodyType>h.body;
            const storage = body.storage, path = body.path, container = body.container;
            if (!utility.validate.valueStr(container) || !utility.validate.valueStr(path) || path !== 'azure') {
                h.status = 400;
            }
            else {
                return filestorage.azure.downloadJson2(container, path)
                    .then(data => {
                        h.body = data;
                        h.setResHeader('Content-Type', 'application/json');
                    })
                    .catch(err => {
                        log.error(err);
                        h.status = 404;
                    });
            }
        })
};

const handlermap = new Map<string, (h: utility.http.HttpPack) => bb<void>>();
handlermap.set('GET', getHandler);

interface BodyType {
    storage: string;
    path: string;
    container: string;
}
