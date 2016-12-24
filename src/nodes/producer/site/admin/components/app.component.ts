import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { LogService } from '../../common/services/log.service';
import { UtilityService } from '../../common/services/utility.service';
import { TaskService } from '../../common/services/task.service';
import { UrlService } from '../../common/services/url.service';
import { RequestService } from '../../common/services/request.service';
import { ConstService } from '../../common/services/const.service';

@Component({
  moduleId: module.id,
  selector: 'stock-analysis',
  templateUrl: './app.component.html',
  providers: [UtilityService, LogService, UrlService, TaskService, RequestService, ConstService]
})
export class AppComponent {
  constructor(private _router: Router) { }

  get currentPage(): string {
    let url = this._router.url;
    if (url[0] === '/') url = url.slice(1);
    return url.split('/')[0];
  }
}
