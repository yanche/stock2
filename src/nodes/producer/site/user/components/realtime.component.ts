
import { Component } from '@angular/core';
import { RtprogService, Rtprog } from '../../common/services/rtprog.service';
import { RtprogoutService, Rtprogout } from '../../common/services/rtprogout.service';
import { RtpriceService, Rtprice, rtLoadingTime } from '../services/rtprice.service';

@Component({
  moduleId: module.id,
  templateUrl: './realtime.component.html',
})
export class RealtimeComponent {
  constructor(private _rtprog: RtprogService, private _rtprogout: RtprogoutService, private _rtprice: RtpriceService) { }

  public rtprogs: Array<Rtprog>;
  public rtprogouts: Array<Rtprogout>;

  private _query() {
    const prm1 = this._rtprog.getAll()
      .then(data => this.rtprogs = data.list)
      .catch(err => console.error(err));
    const prm2 = this._rtprogout.getAll()
      .then(data => this.rtprogouts = data.list)
      .catch(err => console.error(err));
    return Promise.all([prm1, prm2]);
  }

  public rev(rtprogout: Rtprogout) {
    const sp = rtprogout.sp;
    const e = ((this._rtprice.map.get(rtprogout.target) || {}).adjprices || {}).e;
    return rtprogout.glong ? e / sp : sp / e;
  }

  private _loadOnce: boolean = false;
  private _load() {
    if (!this._loadOnce || rtLoadingTime()) {
      this._query()
        .catch(err => console.error(err))
        .then(() => {
          this._loadOnce = true;
          setTimeout(() => this._load(), 5000);
        });
    }
    else {
      setTimeout(() => this._load(), 5000);
      console.log('realtime data, not loading time');
    }
  }
}
