import { Component, Input, OnInit } from '@angular/core';
import { Task, TaskService } from '../../../common/services/task.service';
import { LogService } from '../../../common/services/log.service';
import { ConstService } from '../../../common/services/const.service';

@Component({
    selector: 'rawdata-producer',
    moduleId: module.id,
    templateUrl: './rawdata.component.html'
})
export class RawDataProducerComponent implements OnInit {
    constructor(private _task: TaskService, private _log: LogService, private _const: ConstService) { }

    comments: string;
    submitting: boolean;
    isIndex: boolean;
    start: string;
    end: string;
    targets: Array<string>;

    reset() {
        this.comments = '';
        this.isIndex = false;
        this.targets = [];
        this.start = '';
        this.end = '';
    }

    testData() {
        this.targets = ['000001.XSHE'];
        this.start = '2015-10-01';
        this.end = '2015-10-31';
        this.isIndex = false;
    }

    submit() {
        if (this.submitting || this.targets.length === 0) return;
        this.submitting = true;
        return this._task.createMul(this.targets.map(t => {
            return {
                action: {
                    type: this._const.action.rawData,
                    pack: {
                        target: t,
                        index: this.isIndex,
                        start: this.start.trim() || null,
                        end: this.end.trim() || null
                    }
                },
                comments: this.comments
            }
        }))
            .catch(err => this._log.error(err))
            .then(() => this.submitting = false);
    }

    ngOnInit() {
        this.submitting = false;
        this.reset();
    }
}
