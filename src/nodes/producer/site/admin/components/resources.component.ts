import { Component } from '@angular/core';
import { UrlService } from '../../common/services/url.service';

@Component({
  moduleId: module.id,
  templateUrl: './resources.component.html',
})
export class ResourcesComponent {
  constructor(private _url: UrlService) { }

  allstocks = this._url.blob(resources.allstocks);
  allindexes = this._url.blob(resources.allindexes);
}
