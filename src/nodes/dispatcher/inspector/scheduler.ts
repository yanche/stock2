
import * as config from '../../../config';
import * as bb from 'bluebird';
import * as co from 'co';
import * as db from '../db';
import * as dclient from '../../dclient';
import * as constant from '../../../const';
import * as log from '../../../log';

function genTodayScheduleTs(h: number, m: number): number {
    const d = new Date();
    d.setUTCHours(h);
    d.setUTCMinutes(m);
    d.setUTCSeconds(0);
    d.setUTCMilliseconds(0);
    return d.getTime();
}

function tsWeekend(ts: number) {
    const x = new Date(ts).getUTCDay();
    return x == 0 || x == 6;
}

const systId = 'scheduledtasks';
export function jobScheduleCheck() {
    let lastOpTs: number = null;
    db.systrack.getOne({ _id: systId }, { pack: 1 })
        .then(syst => {
            if (syst != null && syst.pack != null) lastOpTs = syst.pack;
            loop();
        })
        .catch((err: Error) => {
            log.error(err.stack);
        });

    function loop() {
        bb.resolve().then(() => {
            const sts = genTodayScheduleTs(config.jobScheduleTime.h, config.jobScheduleTime.m), nowts = new Date().getTime();
            if (nowts >= sts && (lastOpTs == null || lastOpTs < sts) && !tsWeekend(sts)) {
                return dclient.task.create({ action: { type: constant.action.stockList }, comments: 'scheduled stocklist static files maintain' }).then(x => x._id)
                    .then(stocklisttaskid => {
                        log.info(`scheduled ${constant.action.stockList} task created`);
                        return dclient.task.create({
                            action: { type: constant.action.rawInspect },
                            comments: 'scheduled raw inspect',
                            condition: { type: 'success', pack: stocklisttaskid },
                            constraints: { timeoutLevel: 4, conditionCheckInterval: 1, ttl: 1 }
                        }).then(x => x._id);
                    })
                    .then(rawinspecttaskid => {
                        return dclient.task.create({
                            action: {
                                type: constant.action.afterRawInspect,
                                pack: { rawinspectId: rawinspecttaskid }
                            },
                            condition: { type: 'success', pack: rawinspecttaskid }
                        });
                    })
                    .then(() => {
                        return db.systrack.updateAll({ _id: systId }, { $set: { pack: lastOpTs = new Date().getTime() } }, true);
                    });
            }
        }).catch((err: Error) => {
            console.log('failed to create scheduled tasks');
            console.error(err.stack);
        }).then(() => {
            setTimeout(loop, config.jobSchedulerCheckFreq);
        });
    }
}
