
import * as db from '../db';
import * as bb from 'bluebird';
import * as config from '../../../config';
import * as constant from '../../../const';

export function checkTimeout() {
    console.log('now inspecting the task timeout');
    const nowts = new Date().getTime();
    bb.all([
        db.task.updateAll({ statusId: constant.task.status.processing, 'constraints.timeoutLevel': constant.task.constraints.timeoutLevel.short.code, lastProcessTs: { $lt: nowts - constant.task.constraints.timeoutLevel.short.ms } }, { $set: { statusId: constant.task.status.timeout }, $push: { processLog: { ts: nowts, msg: 'task timeout' } } }, false),
        db.task.updateAll({ statusId: constant.task.status.processing, 'constraints.timeoutLevel': constant.task.constraints.timeoutLevel.medium.code, lastProcessTs: { $lt: nowts - constant.task.constraints.timeoutLevel.medium.ms } }, { $set: { statusId: constant.task.status.timeout }, $push: { processLog: { ts: nowts, msg: 'task timeout' } } }, false),
        db.task.updateAll({ statusId: constant.task.status.processing, 'constraints.timeoutLevel': constant.task.constraints.timeoutLevel.long.code, lastProcessTs: { $lt: nowts - constant.task.constraints.timeoutLevel.long.ms } }, { $set: { statusId: constant.task.status.timeout }, $push: { processLog: { ts: nowts, msg: 'task timeout' } } }, false),
        db.task.updateAll({ statusId: constant.task.status.processing, 'constraints.timeoutLevel': constant.task.constraints.timeoutLevel.exlong.code, lastProcessTs: { $lt: nowts - constant.task.constraints.timeoutLevel.exlong.ms } }, { $set: { statusId: constant.task.status.timeout }, $push: { processLog: { ts: nowts, msg: 'task timeout' } } }, false),
        db.task.updateAll({ statusId: constant.task.status.timeout, 'constraints.ttl': 0 }, { $set: { statusId: constant.task.status.failed }, $push: { processLog: { ts: nowts, msg: 'mark ttl zero and timeout task to failure' } } }, false)
    ])
        .then(() => {
            setTimeout(checkTimeout, config.timeoutCheckFreq);
        }, (err: Error) => {
            console.error('timeout inspector error');
            console.error(err.stack);
        })
}
