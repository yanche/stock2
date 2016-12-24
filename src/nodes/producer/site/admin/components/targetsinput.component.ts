import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'targets-input',
    moduleId: module.id,
    templateUrl: './targetsinput.component.html'
})
export class TargetsInputComponent {
    @Output()
    onTargetsChange = new EventEmitter<Array<string>>();

    total: number = 0;

    private _targets: string = '';
    get targets() { return this._targets; }
    set targets(v: string) {
        console.log(v);
        const targets = (v || '').split(';').map(m => m.trim()).filter(m => m.length > 0);
        this.total = targets.length;
        this.onTargetsChange.emit(targets);
        this._targets = v;
    }
}
