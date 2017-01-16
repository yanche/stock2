
import { Component } from '@angular/core';
import { QueryData, QFilterDef, QueryFn, OptionsPack, QFilterDefType } from '../../common/components/querypage.component';
import { Simulate, SimulateService } from '../../common/services/simulate.service';
import { LogService } from '../../common/services/log.service';
import { Rtplan, RtplanService } from '../../common/services/rtplan.service';
import { StockListService, TargetInfo } from '../../common/services/stocklist.service';
import { Hub } from '../../common/services/utility.service';

@Component({
  moduleId: module.id,
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  private _rtplanhub: Hub<Array<Rtplan>>;
  private _stocklisthub: Hub<Map<string, TargetInfo>>;
  private _indexlisthub: Hub<Map<string, TargetInfo>>;
  private _displaydataloaded: boolean;

  constructor(private _simulate: SimulateService, private _log: LogService, private _rtplan: RtplanService, private _stocklist: StockListService) {
    this._rtplanhub = new Hub<Array<Rtplan>>(() => this._rtplan.getAll({}).then(data => data.list));
    this._stocklisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getStocks());
    this._indexlisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getIndexes());
    this._displaydataloaded = false;
  }

  qfilter: Array<QFilterDef> = [{
    name: 'id',
    prop: '_id'
  }, {
    name: 'rtplanId',
    prop: 'rtplanId'
  }, {
    name: 'target',
    prop: 'target'
  }, {
    name: 'closed',
    prop: 'closed',
    type: QFilterDefType.BOOL
  }]

  refreshTs: number = 0;

  pageData: Simulate[];
  setPageData(list: Simulate[]) {
    if (!this._displaydataloaded)
      this.pageData = list.map(attachRev); //quick display

    Promise.all([this._rtplanhub.get(), this._stocklisthub.get(), this._indexlisthub.get()])
      .then(data => {
        const stockmap = data[1], indexmap = data[2];
        const rtplanmap = new Map<string, string>();
        for (let r of data[0]) rtplanmap.set(r._id, r.name);
        this.pageData = list.map((sim: any) => {
          attachRev(sim);
          sim._name = (stockmap.get(sim.target) || indexmap.get(sim.target) || { name: '' }).name;
          sim._rtplan = rtplanmap.get(sim.rtplanId) || '';
          return sim;
        });
        this._displaydataloaded = true;
      })
      .catch(err => this._log.error(err));
  }

  queryFn: QueryFn = (query: QueryData) => {
    return this._simulate.getMul(query.page, query.pageSize, query.filter, null, query.orderby);
  }

  queryOpt: OptionsPack = {
    defaults: { orderby: { sdts: -1 } }
  }

  showingSimulate: Simulate = null;
  prevShowingSimulate: Simulate = null;
  showSimulate(simulate: Simulate) {
    this._log.info(simulate);
    this.prevShowingSimulate = this.showingSimulate;
    this.showingSimulate = ((this.showingSimulate === simulate) ? null : simulate);
  }
}

function attachRev(sim: Simulate): Simulate {
  const ep = sim.ep || sim.sp;
  (<any>sim)._rev = sim.glong ? (ep / sim.sp) : (sim.sp / ep);
  return sim;
}
