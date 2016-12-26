import { Component, Input } from '@angular/core';

@Component({
    selector: 'action-button',
    moduleId: module.id,
    templateUrl: './actionbutton.component.html',
})
export class ActionButtonComponent {
    @Input()
    waiting: boolean;
    @Input()
    word: string;
    @Input()
    disabled: boolean;
}
