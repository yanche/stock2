
import { Component } from '@angular/core';
import { QueryData, QFilterDef, QueryFn, OptionsPack, QFilterDefType } from '../../common/components/querypage.component';
import { Alert, AlertService, AlertPlan, AlertPlanService } from '../../common/services/alert.service';
import { LogService } from '../../common/services/log.service';
import { Rtplan, RtplanService } from '../../common/services/rtplan.service';
import { StockListService, TargetInfo } from '../../common/services/stocklist.service';
import { Hub } from '../../common/services/utility.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    moduleId: module.id,
    templateUrl: './alerts.component.html',
})
export class AlertsComponent {
    private _rtplanhub: Hub<Map<string, Rtplan>>;
    private _stocklisthub: Hub<Map<string, TargetInfo>>;
    private _indexlisthub: Hub<Map<string, TargetInfo>>;
    private _alertplanhub: Hub<Map<string, AlertPlan>>;
    private _displaydataloaded: boolean;

    constructor(private _route: ActivatedRoute, private _alert: AlertService, private _log: LogService, private _rtplan: RtplanService, private _stocklist: StockListService, private _alertplan: AlertPlanService) {
        this._rtplanhub = new Hub<Map<string, Rtplan>>(() => this._rtplan.getAll({})
            .then(data => {
                const map = new Map<string, Rtplan>();
                for (let rtplan of data.list) map.set(rtplan._id, rtplan);
                return map;
            }));
        this._stocklisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getStocks());
        this._indexlisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getIndexes());
        this._alertplanhub = new Hub<Map<string, AlertPlan>>(() => this._alertplan.getAll({})
            .then(ret => {
                const map = new Map<string, AlertPlan>();
                for (let alertplan of ret.list) map.set(alertplan._id, alertplan);
                return map;
            }));
        this._displaydataloaded = false;
        this.queryOpt = {
            defaults: { orderby: { createdTs: -1 } }
        };
    }

    qfilter: Array<QFilterDef> = [{
        name: 'id',
        prop: '_id'
    }, {
        name: 'rtplanId',
        prop: 'rtplanId',
    }, {
        name: 'alertPlanId',
        prop: 'alertPlanId',
    }, {
        name: 'target',
        prop: 'target'
    }, {
        name: 'new',
        prop: 'new',
        type: QFilterDefType.BOOL
    }]

    pageData: Alert[];
    setPageData(list: Alert[]) {
        if (!this._displaydataloaded)
            this.pageData = list; //quick display

        Promise.all([this._rtplanhub.get(), this._stocklisthub.get(), this._indexlisthub.get(), this._alertplanhub.get()])
            .then(data => {
                const rtplanmap = data[0], stockmap = data[1], indexmap = data[2], alertplanmap = data[3];
                this.pageData = list.map((alert: any) => {
                    const targetName = (stockmap.get(alert.target) || indexmap.get(alert.target) || { name: '' }).name;
                    const alertplan = alertplanmap.get(alert.alertPlanId);
                    const rtplan = alertplan ? rtplanmap.get(alertplan.rtplanId) : null;
                    alert._name = targetName;
                    alert._alertplan = alertplan ? alertplan.desc : '';
                    alert._rtplan = rtplan ? rtplan.name : ''
                    return alert;
                });
                this._displaydataloaded = true;
            })
            .catch(err => this._log.error(err));
    }

    queryFn: QueryFn = (query: QueryData) => {
        return this._alert.getMul(query.page, query.pageSize, query.filter, null, query.orderby);
    }

    queryOpt: OptionsPack
}
