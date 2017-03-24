
import { Component } from '@angular/core';
import { QueryData, SetterQFilter, ReplacerQFilter, QueryFn, OptionsPack, QFilterDefType } from '../../common/components/querypage.component';
import { Simulate, SimulateService } from '../../common/services/simulate.service';
import { LogService } from '../../common/services/log.service';
import { Rtplan, RtplanService } from '../../common/services/rtplan.service';
import { StockListService, TargetInfo } from '../../common/services/stocklist.service';
import { Hub } from '../../common/services/utility.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  moduleId: module.id,
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  private _rtplanhub: Hub<Array<Rtplan>>;
  private _stocklisthub: Hub<Map<string, TargetInfo>>;
  private _indexlisthub: Hub<Map<string, TargetInfo>>;
  private _displaydataloaded: boolean;
  private _loadingparams: boolean;

  constructor(private _route: ActivatedRoute, private _simulate: SimulateService, private _log: LogService, private _rtplan: RtplanService, private _stocklist: StockListService) {
    this._rtplanhub = new Hub<Array<Rtplan>>(() => this._rtplan.getAll({}).then(data => data.list));
    this._stocklisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getStocks());
    this._indexlisthub = new Hub<Map<string, TargetInfo>>(() => this._stocklist.getIndexes());
    this._displaydataloaded = false;
    this._loadingparams = true;
    this.queryOpt = {
      defaults: { orderby: { sdts: -1 } }
    };
    this._route.queryParams
      .subscribe(params => {
        if (!this._loadingparams) return;
        const rtplanId = params['rtplanId'];
        const _id = params['_id'];
        if (rtplanId || _id) {
          const filter: any = {};
          if (rtplanId) filter.rtplanId = rtplanId;
          if (_id) filter._id = _id;
          this.queryOpt.inits = { filter: filter };
          this.runOnInit = true;
        }
        else {
          this.runOnInit = false;
        }
        this._loadingparams = false;
      })
  }

  runOnInit: boolean;

  qfilter: Array<SetterQFilter | ReplacerQFilter> = [{
    name: 'id',
    prop: '_id',
    type: QFilterDefType.NORMAL
  }, {
    name: 'rtplanId',
    prop: 'rtplanId',
    type: QFilterDefType.NORMAL
  }, {
    name: 'target',
    prop: 'target',
    type: QFilterDefType.NORMAL
  }, {
    name: 'closed',
    prop: 'closed',
    type: QFilterDefType.BOOL
  }, {
    name: 'all indexes',
    filter: {
      target: { $in: ['000001.ZICN', '000016.ZICN', '399905.ZICN', '399005.ZICN', '399006.ZICN', '399300.ZICN', '399001.ZICN'] }
    },
    type: QFilterDefType.REPLACE
  }, {
    name: 'macd-bdev',
    filter: {
      rtplanId: {
        $in: [
          'stocks-bdev-macd-dea-100-200-80-nhold300-threshold0.4',
          'stocks-bdev-macd-diff-100-200-80-nhold300-threshold0.4',
          'stocks-bdev-macd-gcross-100-200-80-nhold300-threshold0.4'
        ]
      }
    },
    type: QFilterDefType.REPLACE
  }]

  pageData: Simulate[];
  setPageData(list: Simulate[]) {
    if (!this._displaydataloaded)
      this.pageData = list.map(sim => attachRev(sim, sim.ep, '_rev')); //quick display

    Promise.all([this._rtplanhub.get(), this._stocklisthub.get(), this._indexlisthub.get()])
      .then(data => {
        const stockmap = data[1], indexmap = data[2];
        const rtplanmap = new Map<string, Rtplan>();
        for (let r of data[0]) rtplanmap.set(r._id, r);
        this.pageData = list.map((sim: any) => {
          attachRev(sim, sim.ep, '_rev');
          attachRev(sim, sim.hp, '_hrev');
          attachRev(sim, sim.lp, '_lrev');
          sim._name = (stockmap.get(sim.target) || indexmap.get(sim.target) || { name: '' }).name;
          const rtplan = rtplanmap.get(sim.rtplanId);
          sim._rtplan = rtplan.name;
          sim._rtplansum = rtplan.comments.sum;
          sim._rtplanopt = rtplan.comments.trigger.opt;
          sim._env = sim.env.map((e: any) => {
            return { rev: rev(e.ep, e.sp, sim.glong), target: e.target, name: (indexmap.get(e.target) || { name: '' }).name };
          });
          sim._concernsIn = sim.concernsIn.map((c: any) => {
            return {
              name: c.name,
              view: c.view,
              val: JSON.stringify(c.val, null, 4)
            };
          });
          return sim;
        });
        this._displaydataloaded = true;
      })
      .catch(err => this._log.error(err));
  }

  queryFn: QueryFn = (query: QueryData) => {
    return this._simulate.getMul(query.page, query.pageSize, query.filter, null, query.orderby);
  }

  queryOpt: OptionsPack

  showingSimulate: Simulate = null;
  prevShowingSimulate: Simulate = null;
  showSimulate(simulate: Simulate) {
    this._log.info(simulate);
    this.prevShowingSimulate = this.showingSimulate;
    this.showingSimulate = ((this.showingSimulate === simulate) ? null : simulate);
  }
}

function rev(ep: number, sp: number, glong: boolean): number {
  return glong ? (ep / sp) : (sp / ep);
}

function attachRev(sim: Simulate, ep: number, key: string): Simulate {
  ep = ep || sim.sp;
  (<any>sim)[key] = rev(ep, sim.sp, sim.glong);
  return sim;
}
