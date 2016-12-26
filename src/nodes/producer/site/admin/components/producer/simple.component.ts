import { Component, Input } from '@angular/core';
import { Task, TaskService } from '../../../common/services/task.service';
import { LogService } from '../../../common/services/log.service';
import { ConstService } from '../../../common/services/const.service';

@Component({
    selector: 'simple-producer',
    moduleId: module.id,
    templateUrl: './simple.component.html'
})
export class SimpleProducerComponent {
    constructor(private _task: TaskService, private _log: LogService, private _const: ConstService) { }

    @Input()
    action: string;

    comments: string = '';
    submitting: boolean = false;

    submit() {
        if (this.submitting) return;
        this.submitting = true;
        return this._task.create({
            action: { type: this.action },
            comments: this.comments
        })
            .catch(err => this._log.error(err))
            .then(() => this.submitting = false);
    }
}
