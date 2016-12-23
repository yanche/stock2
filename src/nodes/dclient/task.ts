
import * as d from '../def';
import * as cm from './common';
import * as co from 'co';
import * as bb from 'bluebird';
import * as mongodb from 'mongodb';

function post<T>(body: d.Task | { list: Array<d.Task> }, verb: string, retry: number) {
    return cm.expectJson<T>('POST', 'task', body, retry, { verb: verb.toUpperCase() });
}

export interface TaskCreation {
    _id?: string | mongodb.ObjectID;
    action: { type: string, pack?: any };
    locality?: { target: string };
    condition?: { type: string, pack?: any };
    constraints?: { timeoutLevel: number, conditionCheckInterval: number, ttl: number };
    comments?: string;
}

function refineTaskCreationArg(task: TaskCreation): TaskCreation {
    return {
        _id: task._id,
        action: task.action,
        locality: task.locality,
        condition: task.condition || { type: 'ok' },
        constraints: task.constraints || { timeoutLevel: 3, conditionCheckInterval: 1, ttl: 1 },
        comments: task.comments
    }
}

const _create = cm.genCreate<TaskCreation>('task');
const _createMul = cm.genCreateMul<TaskCreation>('task', 2000);
export const get = cm.genGetOne<d.Task>('task');
export const getAll = cm.genGetAll<d.Task>('task');
export const remove = cm.genRemove('task');

export function create(data: TaskCreation) {
    return _create(refineTaskCreationArg(data));
}

export function createMul(list: Array<TaskCreation>) {
    return _createMul(list.map(refineTaskCreationArg));
}

export function dispatch(data: { limit: Object, preference: Array<Object> }): bb<d.Task> {
    return cm.req('POST', 'task', data, 0, { verb: 'DISPATCH' })
        .then(reply => {
            if (reply.statusCode == 404) return null;
            else if (reply.statusCode === 200) return JSON.parse(reply.data.toString('utf8'));
            else throw new Error(`bad server return in task dispatch: ${reply.statusCode}`);
        });
}

export function report(data: { _id: string, processTs: number, statusId: number, recoverable: boolean, errmsg?: string, quickview?: any }) {
    return cm.req('POST', 'task', data, 0, { verb: 'REPORT' })
        .then(reply => {
            if (reply.statusCode !== 200) throw new Error(`report task status failed with statuscode: ${reply.statusCode}`);
        });
}