import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PreparedDataSet, HypoTestAggrService } from '../../services/hypotestaggr.service';

@Component({
    selector: 'hypotestaggr-producer',
    moduleId: module.id,
    templateUrl: './hypotestaggr.component.html'
})
export class HypoTestAggrProducerComponent implements OnInit {
    constructor(private _haggr: HypoTestAggrService) { }

    comments: string;
    targets: Array<string>;
    cpdefRef: string;
    cpoutDefRefs: GrpUtil;
    envDefs: GrpUtil;
    enums: GrpUtil;
    glongVal: boolean;
    resetTargetsTs: number;

    ngOnInit() {
        this.reset();
    }

    reset() {
        this.cpdefRef = this.comments = '';
        this.resetTargetsTs = new Date().getTime();
        this.enums = new GrpUtil();
        this.cpoutDefRefs = new GrpUtil();
        this.envDefs = new GrpUtil();
        this.glongVal = true;
    }

    testData() {
        this._setTestData(this._haggr.popularDataSet);
    }

    private _setTestData(data: PreparedDataSet) {
        this.reset();
    }
}

class GrpUtil {
    items: Array<GrpItem> = [];

    add(name: string, value: string): this {
        this.items.push({ name: name, value: value });
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
