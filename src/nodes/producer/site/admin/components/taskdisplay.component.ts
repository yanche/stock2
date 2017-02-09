import { Component, Input, OnInit } from '@angular/core';
import { Task } from '../../common/services/task.service';
import { ConstService } from '../../common/services/const.service';
import { LogService } from '../../common/services/log.service';

@Component({
    moduleId: module.id,
    selector: 'task-display',
    templateUrl: './taskdisplay.component.html'
})
export class TaskDisplayComponent implements OnInit {
    constructor(public constant: ConstService, private _log: LogService) { }

    @Input()
    task: Task;

    logTask() {
        this._log.info(this.task);
    }

    displayLog: boolean;
    log: { msg: string; ts: number; err: string };

    ngOnInit() {
        if (this.task.statusId !== this.constant.status.success) {
            this.displayLog = true;
            this.log = this.task.processLog[this.task.processLog.length - 1];
        }
        else {
            this.displayLog = false;
        }
    }
}

@Component({
    moduleId: module.id,
    selector: 'display-log',
    templateUrl: './taskdisplay/displaylog.taskdisplay.component.html'
})
export class DisplayLogTaskDisplayComponent {
    @Input()
    log:  { msg: string; ts: number; err: string };
}

@Component({
    moduleId: module.id,
    selector: 'rawinspect-task-display',
    templateUrl: './taskdisplay/rawinspect.taskdisplay.component.html'
})
export class RawInspectTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'rawsync-task-display',
    templateUrl: './taskdisplay/rawsync.taskdisplay.component.html'
})
export class RawSyncTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'rawdata-task-display',
    templateUrl: './taskdisplay/rawdata.taskdisplay.component.html'
})
export class RawDataTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'stocklist-task-display',
    templateUrl: './taskdisplay/stocklist.taskdisplay.component.html'
})
export class StockListTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'simulate-task-display',
    templateUrl: './taskdisplay/simulate.taskdisplay.component.html'
})
export class SimulateTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'simall-task-display',
    templateUrl: './taskdisplay/simall.taskdisplay.component.html'
})
export class SimAllTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'hypotest-task-display',
    templateUrl: './taskdisplay/hypotest.taskdisplay.component.html'
})
export class HypoTestTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'hypotestaggr-task-display',
    templateUrl: './taskdisplay/hypotestaggr.taskdisplay.component.html'
})
export class HypoTestAggrTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'genrtprog-task-display',
    templateUrl: './taskdisplay/genrtprog.taskdisplay.component.html'
})
export class GenRtProgTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'genrtprogall-task-display',
    templateUrl: './taskdisplay/genrtprogall.taskdisplay.component.html'
})
export class GenRtProgAllTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'delay-task-display',
    templateUrl: './taskdisplay/delay.taskdisplay.component.html'
})
export class DelayTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'afterrawinspect-task-display',
    templateUrl: './taskdisplay/afterrawinspect.taskdisplay.component.html'
})
export class AfterRawInspectTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'lastend-task-display',
    templateUrl: './taskdisplay/lastend.taskdisplay.component.html'
})
export class LastendTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'lastendall-task-display',
    templateUrl: './taskdisplay/lastendall.taskdisplay.component.html'
})
export class LastendAllTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'alertsall-task-display',
    templateUrl: './taskdisplay/alertsall.taskdisplay.component.html'
})
export class AlertsAllTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'alert-task-display',
    templateUrl: './taskdisplay/alert.taskdisplay.component.html'
})
export class AlertTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}

@Component({
    moduleId: module.id,
    selector: 'aftersimall-task-display',
    templateUrl: './taskdisplay/aftersimall.taskdisplay.component.html'
})
export class AfterSimAllTaskDisplayComponent {
    @Input()
    task: Task;
    @Input()
    quickview: any;
}
