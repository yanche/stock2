import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RtprogService } from '../../common/services/rtprog.service';
import { RtprogoutService } from '../../common/services/rtprogout.service';
import { RequestService } from '../../common/services/request.service';
import { StorageProxyService } from '../../common/services/storageproxy.service';
import { RtplanService } from '../../common/services/rtplan.service';
import { RtpriceService } from '../services/rtprice.service';

@Component({
  moduleId: module.id,
  selector: 'chi-wan',
  templateUrl: './app.component.html',
  providers: [Router, RtplanService, RtprogService, RtprogoutService, RtpriceService, RequestService, StorageProxyService]
})
export class AppComponent {
  constructor(private _router: Router) { }

  get currentPage(): string {
    let url = this._router.url;
    if (url[0] === '/') url = url.slice(1);
    return url.split('/')[0];
  }
}
