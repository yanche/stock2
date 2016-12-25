import { Component, Input as InputC, OnInit } from '@angular/core';
import { Task, TaskService } from '../../../common/services/task.service';
import { LogService } from '../../../common/services/log.service';
import { UtilityService } from '../../../common/services/utility.service';

@Component({
    selector: 'targets-action',
    moduleId: module.id,
    templateUrl: './targetsact.component.html'
})
export class TargetsActionComponent implements OnInit {
    constructor(private _log: LogService, private _utility: UtilityService, private _task: TaskService) { }

    @InputC()
    inputList: Array<Input>;
    @InputC()
    action: Action;
    @InputC()
    options: Options;

    inputListExt: Array<_Input>;
    comments: string;
    submitting: boolean;
    targets: Array<string>;

    private _parseRow(raw: string, type: InputType): any {
        switch (type) {
            case InputType.json: return raw.length === 0 ? null : JSON.parse(raw);
            case InputType.dateTS: return raw.length === 0 ? null : this._utility.dateKey2DateTs(raw)
            case InputType.string: return raw.length === 0 ? null : raw;
            case InputType.bool: {
                const b = this._utility.convParamStr(raw);
                if (this._utility.validate.isBool(b)) return b;
                else throw new Error(`cannot parse ${raw} to bool`);
            };
            default: throw new Error(`unknown input type: ${type} for ${raw}`);
        }
    }

    private _defaultInitValue(type: InputType): any {
        switch (type) {
            case InputType.json:
            case InputType.dateTS:
            case InputType.string: return '';
            case InputType.bool: return true;
            default: throw new Error(`unknown input type: ${type}`);
        }
    }

    ngOnInit() {
        this.comments = '';
        this.submitting = false;
        this.targets = [];
        this.inputListExt = <Array<_Input>>this.inputList.slice(0);
        for (let i = 0; i < this.inputListExt.length; ++i)
            this.inputListExt[i].__raw = this.inputList[i].init || this._defaultInitValue(this.inputList[i].type);
    }

    submit() {
        if (this.submitting) return;
        this.submitting = true;
        const inputvals: { [key: string]: any } = {};
        let dobulk = false;
        this.inputListExt.forEach(input => {
            const raw = <string>(input.__raw.toString().trim());
            if (raw.length === 0 && input.bulkOnEmpty && !dobulk) dobulk = true;
            inputvals[input.name] = this._parseRow(raw, input.type);
        });
        let prm: Promise<any> = null;
        if (this.targets.length === 1 && !dobulk) {
            inputvals['target'] = this.targets[0];
            const locality = this.options && this.options.locality ? { target: this.targets[0] } : null
            prm = this._task.create({
                action: { type: this.action.type, pack: inputvals },
                locality: locality,
                comments: this.comments
            })
        }
        else {
            inputvals['targets'] = this.targets.length === 0 ? null : this.targets;
            prm = this._task.create({
                action: { type: this.action.bulkType, pack: inputvals },
                comments: this.comments
            })
        }

        return prm.catch((err: Error) => {
            this._log.error(err.stack);
        })
            .then(() => this.submitting = false);
    }

    inputTypes = InputType;
}

interface _Input extends Input {
    __raw: any;
}

export interface Options {
    locality?: boolean;
}

export interface Action {
    type: string;
    bulkType: string;
}

export enum InputType {
    json,
    dateTS,
    string,
    bool
}

export interface Input {
    title: string;
    name: string;
    type: InputType;
    init?: any;
    hidden?: boolean;
    bulkOnEmpty?: boolean;
}
