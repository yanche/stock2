import { Component } from '@angular/core';
import { QueryData, QFilterDef, QueryFn, OptionsPack } from '../../common/components/querypage.component';
import { Task, TaskService } from '../../common/services/task.service';
import { LogService } from '../../common/services/log.service';

@Component({
  moduleId: module.id,
  templateUrl: './monitor.component.html',
})
export class MonitorComponent {
  constructor(private _task: TaskService, private _log: LogService) { }

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

  refreshTs: number = 0;

  pageData: Task[];
  setPageData(list: Task[]) {
    console.info(list);
  }

  queryFn: QueryFn = (query: QueryData) => {
    console.info(query);
    return this._task.getMul(query.page, query.pageSize, query.filter, null, query.orderby);
  }

  queryOpt: OptionsPack = {
    defaults: { orderby: { createdTs: -1 } }
  }

  closeTask = this._updateGen('CLOSE');
  renewTask = this._updateGen('RENEW');
  upgradeTask = this._updateGen('UPGRADE');
  makereadyTask = this._updateGen('MAKEREADY');

  private _updateGen(verb: string) {
    return (task: Task) => {
      return this._task.statusUpdate(task._id, verb)
        .then(res => this.refreshTs = new Date().getTime())
        .catch(err => this._log.error(err));
    }
  }
}
