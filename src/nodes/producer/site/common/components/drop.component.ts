import { Component, Input, OnInit } from '@angular/core';
import { UrlService } from '../services/url.service';

@Component({
    selector: 'drop',
    moduleId: module.id,
    templateUrl: './drop.component.html',
})
export class DropComponent implements OnInit {
    constructor(private _url: UrlService) { }

    @Input()
    drop: {
        storage: DropLocation,
        container: string,
        path: string
    }

    dropPath: string;

    ngOnInit() {
        switch (this.drop.storage) {
            case DropLocation.Azure: {
                this.dropPath = this._url.blob(this.drop.path, this.drop.container);
                break;
            }
            case DropLocation.Local: {
                this.dropPath = this.drop.path;
                break;
            }
            default: throw new Error(`unknow type of drop location: ${this.drop.storage}`);
        }
    }
}

enum DropLocation {
    Azure = 1,
    Local = 2
}
