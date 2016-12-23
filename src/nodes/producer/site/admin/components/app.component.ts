import { Component } from '@angular/core';

import { LogService } from '../../common/services/log.service';
import { UtilityService } from '../../common/services/utility.service';

@Component({
  moduleId: module.id,
  selector: 'stock-analysis',
  templateUrl: './app.component.html',
  providers: [UtilityService, LogService]
})
export class AppComponent { }
