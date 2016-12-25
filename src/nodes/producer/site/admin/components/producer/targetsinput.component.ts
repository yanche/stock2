import { Component, Output, Input, EventEmitter, OnChanges, SimpleChange } from '@angular/core';

@Component({
    selector: 'targets-input',
    moduleId: module.id,
    templateUrl: './targetsinput.component.html'
})
export class TargetsInputComponent implements OnChanges {
    @Output()
    onTargetsChange = new EventEmitter<Array<string>>();
    @Input()
    refreshTs: number;
    //@Input()


    total: number = 0;

    private _targets: string = '';
    get targets() { return this._targets; }
    set targets(v: string) {
        const targets = (v || '').split(';').map(m => m.trim()).filter(m => m.length > 0);
        this.total = targets.length;
        this.onTargetsChange.emit(targets);
        this._targets = v;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }): void {
        const c = changes['refreshTs'];
        if (c) {
            const r = <number>(c.currentValue);
            if (r) this.targets = '';
        }
    }
}
