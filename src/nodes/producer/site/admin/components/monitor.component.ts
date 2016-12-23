import { Component } from '@angular/core';
import { QueryData, QFilterDef, QueryFn } from '../../common/components/querypage.component';

@Component({
  moduleId: module.id,
  templateUrl: './monitor.component.html',
})
export class MonitorComponent {
  qfilter: Array<QFilterDef> = [{
    name: 'id',
    prop: '_id'
  }, {
    name: 'statusId',
    prop: 'statusId'
  }, {
    name: 'action type',
    prop: 'action.type'
  }, {
    name: 'target',
    prop: 'action.pack.target'
  }]

  queryFn: QueryFn = (query: QueryData) => {
    console.info(query);
    return Promise.resolve({});
  }
}
