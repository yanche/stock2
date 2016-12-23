import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChange } from '@angular/core';
import { LogService } from '../services/log.service';
import { UtilityService } from '../services/utility.service';

@Component({
    selector: 'querypage',
    moduleId: module.id,
    templateUrl: './querypage.component.html',
})
export class QueryPageComponent implements OnInit, OnChanges {
    constructor(private _log: LogService, public utility: UtilityService) { }

    @Input()
    qfilter: Array<QFilterDef>;
    @Input()
    queryFn: QueryFn;
    @Input()
    refreshTs: number;
    @Input()
    options: OptionsPack;
    @Input()
    runOnInit: boolean;
    @Output()
    onPageDataChange = new EventEmitter<Array<any>>();

    qFilterTypes = QFilterDefType;

    queryRaw: {
        pageSize: number;
        page: number;
        filter: string;
        orderby: string;
    };

    private _querying: boolean;
    private _pageInfo: PageInfo;

    private get _query(): QueryData {
        return {
            page: this.queryRaw.page,
            pageSize: this.queryRaw.pageSize,
            filter: this.utility.tryParseJson(this.queryRaw.filter),
            orderby: this.utility.tryParseJson(this.queryRaw.orderby)
        }
    }

    setMongoFilter(field: string, val: string, modifier: string) {
        if (!this.validFilter()) return;
        const q = this._query;
        if (val == null)
            delete q.filter[field]; //unset filter
        else {
            val = val.trim();
            let fval: any = null;
            switch (modifier) {
                case '$in': {
                    fval = { $in: val.split(';').filter(x => x.trim().length > 0).map(this.utility.convParamStr) };
                    break;
                }
                case '$ne': {
                    fval = { $ne: this.utility.convParamStr(val) };
                    break;
                }
                case '$exists': {
                    fval = { $exists: this.utility.convParamStr(val) };
                    break;
                }
                default: fval = this.utility.convParamStr(val);
            }
            q.filter[field] = fval;
            this.queryRaw.filter = JSON.stringify(q.filter[field]);
        }
    }

    validFilter(): boolean {
        return this.utility.valid.json(this.queryRaw.filter);
    }

    validOrderby(): boolean {
        return this.utility.valid.json(this.queryRaw.orderby);
    }

    ngOnInit(): void {
        this._querying = false;
        this.reset();
        const inits = <Options>((this.options || {}).inits || {});
        if (inits.filter) this.queryRaw.filter = inits.filter;
        if (inits.orderby) this.queryRaw.orderby = inits.orderby;
        if (this.runOnInit) this.submitQuery();
        this._pageInfo = {
            page: 1,
            pageSize: 15,
            total: 0,
            totalPages: 0
        };
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }): void {
        const c = changes['refreshTs'];
        if (c) {
            const r = <number>(c.currentValue);
            if (r) this.submitQuery();
        }
    }

    reset(): void {
        const defaults = <Options>((this.options || {}).defaults || {});
        this.queryRaw = { pageSize: 15, page: 1, filter: defaults.filter || '', orderby: defaults.orderby || '' };
    }

    submitQuery(): void {
        if (this._querying || !this.validFilter() || !this.validOrderby()) return;
        this._querying = true;
        this.queryFn(this._query)
            .then(data => {
                this.onPageDataChange.emit(data.list);
                this._pageInfo.page = data.page;
                this._pageInfo.pageSize = data.pageSize;
                this._pageInfo.total = data.total;
                this._pageInfo.total = Math.ceil(data.total / data.pageSize);
            })
            .catch(err => {
                this._log.error(err);
            })
            .then(() => {
                this._querying = false;
            });
    }

    firstPage(): void {
        if (this._pageInfo.page !== 1) {
            this._pageInfo.page = 1;
            this.submitQuery();
        }
    }

    lastPage(): void {
        if (this._pageInfo.page < this._pageInfo.totalPages) {
            this._pageInfo.page = this._pageInfo.totalPages;
            this.submitQuery();
        }
    }

    prevPage(): void {
        if (this._pageInfo.page > 1) {
            this._pageInfo.page--;
            this.submitQuery();
        }
    }

    nextPage(): void {
        if (this._pageInfo.page < this._pageInfo.totalPages) {
            this._pageInfo.page++;
            this.submitQuery();
        }
    }
}

export interface QueryData {
    pageSize: number;
    page: number;
    filter: { [key: string]: any };
    orderby: { [key: string]: any };
}

export interface QFilterDef {
    name: string;
    prop: string;
    type?: QFilterDefType;
}

export enum QFilterDefType {
    NORMAL,
    EXISTS,
    BOOL
}

interface Options {
    filter: string;
    orderby: string;
}

interface PageInfo {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface OptionsPack {
    defaults?: Options;
    inits?: Options;
    buttons?: {
        onclick: (query: QueryData) => void;
        name: string;
    }
}

export interface QueryFn {
    (query: QueryData): Promise<{
        list: Array<any>;
        page: number;
        pageSize: number;
        total: number;
    }>;
}
