import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { LogService } from '../services/log.service';
import { UtilityService } from '../services/utility.service';
import { GetMulReturn } from '../services/request.service';

@Component({
    selector: 'query-page',
    moduleId: module.id,
    templateUrl: './querypage.component.html',
})
export class QueryPageComponent implements OnInit {
    constructor(private _log: LogService, public utility: UtilityService) { }

    @Input()
    qfilter: Array<QFilterDef>;
    @Input()
    queryFn: QueryFn;
    @Input()
    set refreshTs(val: number) {
        if (val) this.submitQuery();
    }
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

    querying: boolean;

    pageInfo: PageInfo;

    private get _query(): QueryData {
        return {
            page: this.queryRaw.page,
            pageSize: this.queryRaw.pageSize,
            filter: this.utility.tryParseJson(this.queryRaw.filter),
            orderby: this.utility.tryParseJson(this.queryRaw.orderby)
        }
    }

    replaceMongoFilter(filter: Object) {
        this.queryRaw.filter = JSON.stringify(filter);
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
        }
        this.replaceMongoFilter(q.filter);
    }

    validFilter(): boolean {
        return this.utility.validate.json(this.queryRaw.filter);
    }

    validOrderby(): boolean {
        return this.utility.validate.json(this.queryRaw.orderby);
    }

    ngOnInit(): void {
        this.querying = false;
        this.reset();
        const inits = <Options>((this.options || {}).inits || {});
        if (inits.filter) this.queryRaw.filter = JSON.stringify(inits.filter);
        if (inits.orderby) this.queryRaw.orderby = JSON.stringify(inits.orderby);
        if (this.runOnInit) this.submitQuery();
        this.pageInfo = {
            page: 1,
            pageSize: 15,
            total: 0,
            totalPages: 0
        };
    }

    reset(): void {
        const defaults = <Options>((this.options || {}).defaults || {});
        this.queryRaw = { pageSize: 15, page: 1, filter: JSON.stringify(defaults.filter || {}), orderby: JSON.stringify(defaults.orderby || {}) };
    }

    submitQuery(): void {
        if (this.querying || !this.validFilter() || !this.validOrderby()) return;
        this.querying = true;
        this.queryFn(this._query)
            .then(data => {
                this.onPageDataChange.emit(data.list);
                this.pageInfo.page = data.page;
                this.pageInfo.pageSize = data.pageSize;
                this.pageInfo.total = data.total;
                this.pageInfo.totalPages = Math.ceil(data.total / data.pageSize);
            })
            .catch(err => {
                this._log.error(err);
            })
            .then(() => {
                this.querying = false;
            });
    }

    firstPage(): void {
        if (this.pageInfo.page !== 1) {
            this.queryRaw.page = 1;
            this.submitQuery();
        }
    }

    lastPage(): void {
        if (this.pageInfo.page < this.pageInfo.totalPages) {
            this.queryRaw.page = this.pageInfo.totalPages;
            this.submitQuery();
        }
    }

    prevPage(): void {
        if (this.pageInfo.page > 1) {
            this.queryRaw.page = this.pageInfo.page - 1;
            this.submitQuery();
        }
    }

    nextPage(): void {
        if (this.pageInfo.page < this.pageInfo.totalPages) {
            this.queryRaw.page = this.pageInfo.page + 1;
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

interface QFilterDef {
    type?: QFilterDefType;
}

export interface SetterQFilter extends QFilterDef {
    name: string;
    prop: string;
}

export interface ReplacerQFilter extends QFilterDef {
    filter: Object;
}

export enum QFilterDefType {
    NORMAL,
    EXISTS,
    BOOL,
    REPLACE
}

interface Options {
    filter?: { [key: string]: any };
    orderby?: { [key: string]: any };
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
    (query: QueryData): Promise<GetMulReturn<any>>;
}
