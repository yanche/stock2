import { Component, Output, Input, EventEmitter } from '@angular/core';

@Component({
    selector: 'targets-input',
    moduleId: module.id,
    templateUrl: './targetsinput.component.html'
})
export class TargetsInputComponent  {
    @Output()
    onTargetsChange = new EventEmitter<Array<string>>();
    @Input()
    set targets(val: Array<string>) {
        this.resetTargets(val);
        this._targetstr = val.join(';');
    }

    resetTargets(val:Array<string>) {
        const t = val.map(m => m.trim()).filter(m => m.length > 0);
        if ( this._targets.length !== t.length ||  this._targets.some((s, idx) => s !== t[idx])) {
            this.onTargetsChange.emit(t);
            this._targets = t;
            this.total = t.length;
        }
    }

    private _targets: Array<string> = [];
    private _targetstr: string = '';

    get targetstr() { return this._targetstr; }
    set targetstr(v: string) {
        this.resetTargets((v || '').split(';'));
        this._targetstr = v;
    }

    total: number = 0;
}
