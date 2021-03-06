
import * as config from '../../../config';
import * as bb from 'bluebird';
import * as co from 'co';
import * as db from './db';
import * as dclient from '../../dclient';
import * as constant from '../../../const';
import * as log from '../../../log';

function genTodayScheduleTs(h: number, m: number): number {
    const d = new Date();
    let hrs = d.getUTCHours() + 8;
    if (hrs >= 24) {
        d.setUTCDate(d.getUTCDate() + 1);
        hrs -= 24;
    }
    d.setUTCHours(d.getUTCHours() - hrs + h);
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
                return dclient.task.createOne({ action: { type: constant.action.stockList }, comments: 'scheduled stocklist static files maintain' }).then(x => x._id)
                    .then(stocklisttaskid => {
                        log.info(`scheduled ${constant.action.stockList} task created`);
                        return dclient.task.createOne({
                            action: { type: constant.action.rawInspect },
                            comments: 'scheduled raw inspect',
                            condition: { type: 'success', pack: stocklisttaskid },
                            constraints: { timeoutLevel: 4, conditionCheckInterval: 1, ttl: 1 }
                        }).then(x => x._id);
                    })
                    .then(rawinspecttaskid => {
                        return dclient.task.createOne({
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
            log.error('failed to create scheduled tasks');
            log.error(err.stack);
        }).then(() => {
            setTimeout(loop, config.jobSchedulerCheckFreq);
        });
    }
}
