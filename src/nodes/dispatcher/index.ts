
import * as inspector from './inspector';
import * as config from '../../config';
import * as http from 'http';
import * as utility from '../../utility';
import * as handlers from './handlers';
import * as log from '../../log';

export function init(port: number) {
    http.createServer((req, res) => {
        const hp = new utility.http.HttpPack(req, res);
        hp.init()
            .then(() => {
                if (hp.method !== 'OPTIONS') {
                    const resx = hp.path.split('/')[1];
                    const handler = handlers.findHandler(resx);
                    if (handler == null) {
                        console.log(`dispatcher handler not found for resx: ${resx}`);
                        hp.status = 404;
                    }
                    else {
                        return handler(hp);
                    }
                }
            })
            .catch((err: Error) => {
                log.error(err.stack);
                hp.status = 500;
            })
            .then(() => {
                hp.setResHeader('Access-Control-Allow-Credentials', 'true');
                hp.setResHeader('Access-Control-Allow-Headers', 'Content-Type,Verb');
                hp.setResHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,LOCK,OPTIONS');
                hp.setResHeader('Access-Control-Allow-Origin', '*');
                hp.setResHeader('Access-Control-Max-Age', '3600');
                hp.send();
            });
    }).listen(port);

    inspector.checkPreCondition();
    inspector.checkTimeout();
    if (config.scheduledTask)
        inspector.jobScheduleCheck();
}
