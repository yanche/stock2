import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LogService } from '../../common/services/log.service';
import { UrlService } from '../../common/services/url.service';
import { UtilityService } from '../../common/services/utility.service';
import { ConstService } from '../../common/services/const.service';
import { RtprogService } from '../../common/services/rtprog.service';
import { RtprogoutService } from '../../common/services/rtprogout.service';
import { RequestService } from '../../common/services/request.service';
import { StorageProxyService } from '../../common/services/storageproxy.service';
import { RtplanService } from '../../common/services/rtplan.service';
import { StockListService } from '../../common/services/stocklist.service';
import { SimulateService } from '../../common/services/simulate.service';
import { RtpriceService } from '../services/rtprice.service';
import { AlertService, AlertPlanService } from '../../common/services/alert.service';

@Component({
  moduleId: module.id,
  selector: 'chi-wan',
  templateUrl: './app.component.html',
  providers: [SimulateService, LogService, StockListService, UtilityService, UrlService, ConstService, RtplanService, RtprogService, RtprogoutService, RtpriceService, RequestService, StorageProxyService, AlertService, AlertPlanService]
})
export class AppComponent {
  constructor(private _router: Router) { }

  get currentPage(): string {
    let url = this._router.url;
    if (url[0] === '/') url = url.slice(1);
    return url.split('/')[0];
  }
}
