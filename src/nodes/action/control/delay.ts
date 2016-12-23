
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as log from '../../../log';
import * as dclient from '../../dclient';
import * as wmact from '../wmcloud';
import * as constant from '../../../const';
import * as config from '../../../config';

export interface DelayInput {
    delayMs: number;
    tasks: Array<dclient.task.TaskCreation>;
}

export interface DelayOutput {
    time: number;
}

export const action = new Action<DelayInput, DelayInput, DelayOutput>({
    refine: utility.id,
    validate: (input: DelayInput): boolean => {
        return utility.validate.posInt(input.delayMs) && Array.isArray(input.tasks) && input.tasks.length > 0;
    },
    resolve: (input: DelayInput): bb<DelayOutput> => {
        return bb.resolve(new Date().getTime() + input.delayMs)
            .then(time => {
                return dclient.task.createMul(input.tasks.map(task => {
                    let cond = { type: constant.dispatcherCond.timer, pack: <any>time };
                    if (task.condition) cond = { type: 'and', pack: [task.condition, cond] };
                    task.condition = cond;
                    return task;
                }))
                    .then(() => { return { time: time }; });
            });
    }
});