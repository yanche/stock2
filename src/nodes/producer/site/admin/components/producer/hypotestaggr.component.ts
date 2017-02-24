import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PreparedDataSet, HypoTestAggrService } from '../../services/hypotestaggr.service';
import { UtilityService } from '../../../common/services/utility.service';
import { ConstService } from '../../../common/services/const.service';
import { Task, TaskCreation, TaskService } from '../../../common/services/task.service';
import { LogService } from '../../../common/services/log.service';

@Component({
    selector: 'hypotestaggr-producer',
    moduleId: module.id,
    templateUrl: './hypotestaggr.component.html'
})
export class HypoTestAggrProducerComponent implements OnInit {
    constructor(private _haggr: HypoTestAggrService, private _utility: UtilityService, private _const: ConstService, private _task: TaskService, private _log: LogService) { }

    comments: string;
    targets: Array<string>;
    envMap: string;
    cpdefRef: string;
    cpoutDefRefs: GrpUtil;
    envDefs: GrpUtil;
    enums: GrpUtil;
    glongVal: boolean;
    submitting: boolean;
    glong: boolean;

    ngOnInit() {
        this.reset();
        this.submitting = false;
    }

    reset() {
        this.envMap = this.cpdefRef = this.comments = '';
        this.enums = new GrpUtil();
        this.cpoutDefRefs = new GrpUtil();
        this.envDefs = new GrpUtil();
        this.glongVal = true;
        this.targets = [];
        this.glong = true;
    }

    testData() {
        this._setTestData(this._haggr.popularDataSet);
    }

    private _setTestData(data: PreparedDataSet) {
        this.reset();
        this.targets = ['000001.XSHE'];
        this.cpdefRef = data.cpdefRef;
        this.envMap = data.envMap;
        data.enums.forEach(e => this.enums.add(e.name, e.values));
        data.cpoutDefRefs.forEach(c => this.cpoutDefRefs.add(c.name, c.dpref));
        data.envRefs.forEach(e => this.envDefs.add(e.name, e.dpref));
    }

    submit() {
        if (this.submitting) return;
        return Promise.resolve()
            .then(() => {
                this.submitting = true;
                const penum: { [key: string]: any } = {}, enumnames = this.enums.items.map(i => i.name);
                this.enums.items.forEach(e => {
                    if (e.name === 'glong') throw new Error('params name cannot be glong');
                    if (e.name in penum) throw new Error(`params name duplicates: ${e.name}`);
                    penum[e.name] = e.value.split(';').map(q => q.trim()).filter(q => q.length > 0).map(this._utility.convParamStr);
                });
                //glong is the last parameter
                penum['glong'] = [this.glong];
                enumnames.push('glong');
                const envMap = JSON.parse(this.envMap);
                const cpdefRef = JSON.parse(this.cpdefRef);
                const cpoutDefRefs: { [key: string]: any } = {}, cpoutnames = this.cpoutDefRefs.items.map(i => i.name);
                this.cpoutDefRefs.items.forEach(c => cpoutDefRefs[c.name] = JSON.parse(c.value));
                const envDefs: { [key: string]: any } = {}, envnames = this.envDefs.items.map(i => i.name);;
                this.envDefs.items.forEach(c => envDefs[c.name] = JSON.parse(c.value));
                const comments = this.comments;
                const tasks = this.targets.map((t): TaskCreation => {
                    return {
                        action: {
                            type: this._const.action.hypoTest,
                            pack: {
                                target: t,
                                penum: penum,
                                envMap: this._utility.refReplace(envMap, { target: t }),
                                cpDefRef: this._utility.refReplace(cpdefRef, { target: t }),
                                cpoutDefRefs: this._utility.refReplace(cpoutDefRefs, { target: t }),
                                envDefs: this._utility.refReplace(envDefs, { target: t }),
                                header: false
                            }
                        },
                        locality: { target: t },
                        comments: `${comments} - ${t}`
                    };
                });
                return this._task.createMul(tasks)
                    .then(data => data.list)
                    .then(list => this._task.create({
                        action: {
                            type: this._const.action.hypoTestAggr,
                            pack: {
                                ids: list,
                                paramNames: enumnames,
                                envNames: envnames,
                                cpoutNames: cpoutnames,
                                filename: comments
                            }
                        },
                        condition: { type: this._const.dispatcherCond.success, pack: list },
                        comments: comments
                    }));
            })
            .catch(err => {
                this._log.error(err);
            })
            .then(() => this.submitting = false);
    }

    standardInput: string = '';
    genStandardInput() {
        this.standardInput = JSON.stringify(<StandardInput>{
            envMap: this.envMap,
            cpdefRef: this.cpdefRef,
            cpoutDefRefs: this.cpoutDefRefs.items.map(c => { return { name: c.name, dp: c.value } }),
            envDefs: this.envDefs.items.map(e => { return { name: e.name, dp: e.value } }),
            enums: this.enums.items.map(e => { return { name: e.name, values: e.value } })
        });
    }
    applyStandardInput() {
        this.reset();
        const input = <StandardInput>JSON.parse(this.standardInput);
        this.cpdefRef = input.cpdefRef;
        this.envMap = input.envMap;
        input.cpoutDefRefs.forEach(e => this.cpoutDefRefs.add(e.name, e.dp));
        input.envDefs.forEach(e => this.envDefs.add(e.name, e.dp));
        input.enums.forEach(e => this.enums.add(e.name, e.values));
    }
}

class GrpUtil {
    items: Array<GrpItem> = [];

    add(name: string, value: string): this {
        this.items.push({ name: name || '', value: value || '' });
        return this;
    }
    remove(item: GrpItem): this {
        this.items = this.items.filter(x => x !== item);
        return this;
    }
}

interface GrpItem {
    name: string;
    value: string;
}

interface StandardInput {
    cpdefRef: string;
    envMap: string;
    cpoutDefRefs: Array<{ name: string; dp: string }>;
    envDefs: Array<{ name: string; dp: string }>;
    enums: Array<{ name: string; values: string }>;
}
