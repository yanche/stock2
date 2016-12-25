
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { UrlService } from './url.service';
import { RequestService } from './request.service';
import { ConstService } from './const.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class TaskService {
    constructor(private _http: Http, private _url: UrlService, private _req: RequestService) { }

    statusUpdate(taskId: string, verb: string): Promise<Response> {
        return this._http.request(this._url.dispatcher('task'), {
            method: 'POST',
            headers: new Headers({ verb: verb.toUpperCase() }),
            search: `_ts=${new Date().getTime()}`,
            body: { _id: taskId }
        }).toPromise();
    }

    getMul(page: number, pageSize: number, filter?: Object, fields?: Object, orderby?: Object) {
        return this._req.getMul<Task>('task', page, pageSize, filter, fields, orderby);
    }

    create(task: TaskCreation) {
        return this._req.create<TaskCreation>('task', refineTaskCreationArg(task));
    }

    createMul(tasks: Array<TaskCreation>) {
        return this._req.createMul<TaskCreation>('task', tasks.map(refineTaskCreationArg));
    }
}

export interface Task {
    _id?: string;
    locality?: Object;
    condition?: { type: string, pack?: any };
    action?: { type: string, pack?: any };
    postAction?: Object;
    constraints?: { ttl?: number, conditionCheckInterval?: number, timeoutLevel?: number };
    comments?: string;
    statusId?: number;
    createdTs?: number;
    processLog?: Array<{ msg: string; ts: number; err: string }>;
    lastProcessTs?: number;
    nextConditionCheckTs?: number;
    lastConditionCheckTs?: number;
    quickview?: Object;
    priority?: number;
    assigned?: number;
}

export interface TaskCreation {
    action: { type: string, pack?: any };
    locality?: { target: string };
    condition?: { type: string, pack?: any };
    constraints?: { timeoutLevel: number, conditionCheckInterval: number, ttl: number };
    comments?: string;
}

function refineTaskCreationArg(task: TaskCreation): TaskCreation {
    return {
        action: task.action,
        locality: task.locality,
        condition: task.condition || { type: 'ok' },
        constraints: task.constraints || { timeoutLevel: 3, conditionCheckInterval: 1, ttl: 1 },
        comments: task.comments
    }
}
