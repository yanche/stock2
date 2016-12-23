import { Component } from '@angular/core';

import { LogService } from '../../common/services/log.service';
import { UtilityService } from '../../common/services/utility.service';
import { TaskService } from '../../common/services/task.service';
import { UrlService } from '../../common/services/url.service';
import { RequestService } from '../../common/services/request.service';

@Component({
  moduleId: module.id,
  selector: 'stock-analysis',
  templateUrl: './app.component.html',
  providers: [UtilityService, LogService, UrlService, TaskService, RequestService]
})
export class AppComponent { }
