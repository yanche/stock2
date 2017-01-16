
import { Component } from '@angular/core';
import { LogService } from '../../common/services/log.service';
import { RtprogService, Rtprog } from '../../common/services/rtprog.service';
import { RtprogoutService, Rtprogout } from '../../common/services/rtprogout.service';
import { Rtplan, RtplanService } from '../../common/services/rtplan.service';
import { StockListService } from '../../common/services/stocklist.service';
import { RtpriceService, Rtprice } from '../services/rtprice.service';

@Component({
  moduleId: module.id,
  templateUrl: './realtime.component.html',
})
export class RealtimeComponent {
  constructor(private _log: LogService, private _stocklist: StockListService, private _rtplan: RtplanService, private _rtprog: RtprogService, private _rtprogout: RtprogoutService, private _rtprice: RtpriceService) {
    this._load();
  }

  public rtprogs: Array<any>;
  public rtprogouts: Array<any>;

  public click(t: any) {
    this._log.info(t);
  }

  private _query() {
    return Promise.all([
      this._rtprog.getAll({ hit: true }),
      this._rtprogout.getAll({ hit: true }),
      this._rtprice.getAll(),
      this._rtplan.getAll({}),
      this._stocklist.getIndexes(),
      this._stocklist.getStocks()
    ])
      .then(data => {
        const rtprog = data[0].list;
        const rtprogout = data[1].list;
        const rtpricemap = data[2];
        const rtplanmap = new Map<string, Rtplan>();
        for (let r of data[3].list) rtplanmap.set(r._id, r);
        const indexes = data[4];
        const stocks = data[5];

        this.rtprogs = rtprog.map(mapFn);
        this.rtprogouts = rtprogout.map(mapFnOut);

        function mapFn(p: Rtprog) {
          return {
            target: p.target,
            name: (stocks.get(p.target) || indexes.get(p.target) || { name: '' }).name,
            rtplan: rtplanmap.get(p.rtplanId) || { comments: { sum: '' } },
            hitUpdateTs: p.hitUpdateTs,
            glong: p.glong,
            price: rtpricemap.get(p.target) || { prices: {} },
            _origin: p
          }
        }
        function mapFnOut(p: Rtprogout) {
          const ret: any = mapFn(p);
          const sp = p.sp;
          const e = ((rtpricemap.get(p.target) || {}).adjprices || {}).e;
          ret.rev = p.glong ? e / sp : sp / e;
          ret.sdts = p.sdts
          return ret;
        }
      });
  }

  private _loadOnce: boolean = false;
  private _loading: boolean = false;
  private _load() {
    if (!this._loadOnce || (rtLoadingTime() && !this._loading)) {
      this._loading = true;
      this._query()
        .catch(err => console.error(err))
        .then(() => {
          this._loading = false;
          this._loadOnce = true;
          setTimeout(() => this._load(), 5000);
        });
    }
    else {
      setTimeout(() => this._load(), 5000);
      if (!this._loading)
        console.log('realtime data, not loading time');
      else
        console.log('realtime data, not loading because we have pending request');
    }
  }
}

function rtLoadingTime() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day == 0 || day == 6)
    return false; //not on weekends
  const ub = new Date();
  ub.setUTCHours(7); //15:00 China time
  ub.setUTCMinutes(0);
  ub.setUTCSeconds(0);
  ub.setUTCMilliseconds(0);
  const lb = new Date();
  lb.setUTCHours(1); //9:30 China time
  lb.setUTCMinutes(30);
  lb.setUTCSeconds(0);
  lb.setUTCMilliseconds(0);
  const nowts = now.getTime();
  return nowts >= lb.getTime() && nowts <= ub.getTime();
}
