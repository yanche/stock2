
import * as bb from 'bluebird';
import * as log from '../../log';
import * as constants from '../../const';
import * as datapvd from '../../datapvd';
import * as dclient from '../dclient';
import * as action from '../action';

class Idol {
    private _idols = [0, 5000, 20000];
    private _idx = 0;

    breakMore(): number {
        if (this._idx < this._idols.length - 1) this._idx++;
        return this.current();
    }
    current(): number {
        return this._idols[this._idx];
    }
    hurry(): number {
        this._idx = 0;
        return this.current();
    }
}

const idol = new Idol();
let sigint = false, working = false, started = false;

//limit is a mongo filter
export function init(limit?: Object) {
    if (started) throw new Error('consumer already started');
    started = true;
    process.on('SIGINT', function () {
        if (!working)
            process.exit(0);
        else {
            sigint = true;
            log.info('will end process after current processing loop completes');
        }
    });
    loop(limit);
}

function loop(limit: Object) {
    bb.delay(idol.current())
        .then(() => {
            working = true;
            return work(limit);
        })
        .then(() => working = false)
        .then(() => {
            if (!sigint) loop(limit);
            else {
                log.info('process ends on ctrl+C');
                process.exit(0);
            }
        })
        .catch((err: Error) => {
            log.error(err.stack);
            log.info('consumer will stop execution as an unexpected error was caught');
        });
}

function work(limit: Object) {
    return bb.resolve()
        .then(() => {
            const cachedT = datapvd.cachedTargets();
            return dclient.task.dispatch({
                limit: limit,
                preference: cachedT.length == 0 ? [] : [{ 'locality.target': { $in: cachedT } }]
            });
        })
        .then(task => {
            if (task == null) {
                log.info('no task from server, now waiting');
                idol.breakMore();
            }
            else {
                idol.hurry();
                return action.resolve(task.action, task)
                    .then(qv => {
                        return dclient.task.report({ processTs: task.lastProcessTs, statusId: constants.task.status.success, _id: <string>task._id, quickview: qv })
                            .then(() => {
                                log.info(`task finished: ${task._id}, ${task.comments}`);
                            }, (err: Error) => {
                                log.error(` !!!CRITICAL!!! failed to report task success to server: ${err.stack}`);
                                throw err;
                            });
                    }, (err: Error) => {
                        log.error(err.stack);
                        return dclient.task.report({ processTs: task.lastProcessTs, statusId: constants.task.status.failed, errmsg: err.stack, _id: <string>task._id, recoverable: (<any>err).code === 'ETIMEDOUT' })
                            .then(() => {
                                log.info(`task failed: ${task._id}, ${task.comments}`);
                            }, (err: Error) => {
                                log.error(` !!!CRITICAL!!! failed to report task failure to server: ${err.stack}`);
                                throw err;
                            });
                    });
            }
        });
}
