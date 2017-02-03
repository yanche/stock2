import { Component, Input, OnInit } from '@angular/core';
import { Task, TaskService } from '../../../common/services/task.service';
import { LogService } from '../../../common/services/log.service';
import { ConstService } from '../../../common/services/const.service';

@Component({
    selector: 'alertall-producer',
    moduleId: module.id,
    templateUrl: './alertsall.component.html'
})
export class AlertAllProducerComponent implements OnInit {
    constructor(private _task: TaskService, private _log: LogService, private _const: ConstService) { }

    submitting: boolean;

    submit() {
        if (this.submitting) return;
        this.submitting = true;
        return this._task.create({ action: { type: this._const.action.alertsAll } })
            .catch(err => this._log.error(err))
            .then(() => this.submitting = false);
    }

    ngOnInit() {
        this.submitting = false;
    }
}
