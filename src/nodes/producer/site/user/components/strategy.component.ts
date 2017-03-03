
import { Component } from '@angular/core';
import { QueryData, QFilterDef, QueryFn, OptionsPack } from '../../common/components/querypage.component';
import { LogService } from '../../common/services/log.service';
import { Rtplan, RtplanService, RtplanTrigger } from '../../common/services/rtplan.service';

@Component({
  moduleId: module.id,
  templateUrl: './strategy.component.html',
})
export class StrategyComponent {

  constructor(private _log: LogService, private _rtplan: RtplanService) { }

  qfilter: Array<QFilterDef> = [{
    name: 'id',
    prop: '_id'
  }]

  pageData: Rtplan[];
  setPageData(list: Rtplan[]) {
    this.pageData = list.map(rtplan => {
      return {
        id: rtplan._id,
        name: rtplan.name,
        doc: rtplan.doc,
        createdTs: rtplan.createdTs,
        summary: (rtplan.comments || { sum: '' }).sum,
        targetScope: rtplanTargets(rtplan),
        glong: rtplan.glong,
        lookback: lookbackToArray(<any>rtplan.lookback),
        desc: (rtplan.comments || { desc: '' }).desc,
        trigger: rtplanTrigger(rtplan.comments.trigger),
        triggerOut: rtplanTrigger(rtplan.comments.triggerOut),
        _origin: rtplan
      };
    });
  }

  queryFn: QueryFn = (query: QueryData) => {
    return this._rtplan.getMul(query.page, query.pageSize, query.filter, null, query.orderby);
  }

  queryOpt: OptionsPack = {
    defaults: { orderby: { createdTs: -1 } }
  }

  showingRtplan: Rtplan = null;
  prevShowingRtplan: Rtplan = null;
  showRtplan(rtplan: Rtplan) {
    this._log.info(rtplan);
    this.prevShowingRtplan = this.showingRtplan;
    this.showingRtplan = ((this.showingRtplan === rtplan) ? null : rtplan);
  }
}

function rtplanTargets(rtplan: Rtplan): string {
  switch (rtplan.targetScope.type) {
    case 'allstocks': return 'all stocks';
    case 'allindexes': return 'all indexes';
    case 'in': return `selected(${rtplan.targetScope.pack.length})`;
    case 'in': return `excluded(${rtplan.targetScope.pack.length})`;
    default: return '';
  }
}

function rtplanTrigger(trigger: RtplanTrigger): RtplanTrigger {
  const env = (trigger && trigger.env) || [];
  const opt = (trigger && trigger.opt) || [];
  const main = (trigger && trigger.main) || '';
  return {
    main: main,
    env: env,
    opt: opt
  };
}

function lookbackToArray(lookback: { [key: string]: Array<{ name: string, value: Array<Object> }> }) {
  const ret = new Array<{ name: string, value: Array<Object> }>();
  for (let i in lookback) {
    ret.push({ name: i, value: lookback[i] });
  }
  return ret;
}
