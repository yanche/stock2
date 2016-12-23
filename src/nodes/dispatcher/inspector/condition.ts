
import * as constant from '../../../const';
import * as config from '../../../config';
import * as db from '../db';
import * as bb from 'bluebird';
import * as d from '../../def';
import * as mods from '../../../mods';
import * as condition from '../condition';
import * as co from 'co';
import * as utility from '../../../utility';

function getConditionCheckInterval(code: number): number {
    switch (code) {
        case constant.task.constraints.conditionCheckInterval.short.code:
            return constant.task.constraints.conditionCheckInterval.short.ms;
        case constant.task.constraints.conditionCheckInterval.medium.code:
            return constant.task.constraints.conditionCheckInterval.medium.ms;
        case constant.task.constraints.conditionCheckInterval.long.code:
            return constant.task.constraints.conditionCheckInterval.long.ms;
        case constant.task.constraints.conditionCheckInterval.exlong.code:
            return constant.task.constraints.conditionCheckInterval.exlong.ms;
        default:
            return constant.task.constraints.conditionCheckInterval.medium.ms;
    }
}

export function checkPreCondition() {
    console.log('now inspecting the task pre-condition');
    bb.all([
        db.task.getMul({ statusId: constant.task.status.new }, { condition: 1, _id: 1, constraints: 1 }, null, 0, 20),
        db.task.getMul({ statusId: constant.task.status.conditionCheckInterval, nextConditionCheckTs: { $lt: new Date().getTime() } }, { condition: 1, _id: 1, constraints: 1 }, { lastConditionCheckTs: 1 }, 0, 20)
    ])
        .then(data => {
            const tasks = <Array<d.Task>>data[0].concat(data[1]);
            if (tasks.length > 0) {
                console.log(`now checking pre-condition of ${tasks.length} tasks`);
                mods.roll(tasks, (task: d.Task) => {
                    return new bb((res, rej) => {
                        co(function* (): any {
                            try {
                                var cond: boolean, nowts = new Date().getTime();
                                try {
                                    cond = yield condition.resolve(task.condition);
                                }
                                catch (err) {
                                    console.log(err.stack);
                                    yield db.task.updateAll({ _id: task._id }, { $set: { statusId: constant.task.status.abandoned }, $push: { processLog: { ts: nowts, msg: 'got an error when check task pre-condition, mark as abandoned status' } } }, false);
                                    return;
                                }
                                if (cond)
                                    yield db.task.updateAll({ _id: task._id }, { $set: { statusId: constant.task.status.prepared }, $push: { processLog: { ts: nowts, msg: 'set status to prepared' } } }, false);
                                else
                                    yield db.task.updateAll({ _id: task._id }, { $set: { statusId: constant.task.status.conditionCheckInterval, lastConditionCheckTs: nowts, nextConditionCheckTs: utility.date.dateOffset(nowts, { ms: getConditionCheckInterval(task.constraints.conditionCheckInterval) }).getTime() } }, false);
                            }
                            catch (err) {
                                console.error('pre-condition inspector got Error');
                                console.error(err.stack);
                            }
                        }).then(res, rej);
                    });
                }, Math.min(10, tasks.length))
                    .catch((err: Error) => {
                        console.error('pre-condition inspector got Error');
                        console.error(err.stack);
                    })
                    .then(() => {
                        setTimeout(checkPreCondition, config.conditionCheckFreq);
                    });
            }
        });
}
