import { Component } from '@angular/core';
import { QueryData, SetterQFilter, QFilterDefType, QueryFn, OptionsPack } from '../../common/components/querypage.component';
import { Task, TaskService } from '../../common/services/task.service';
import { LogService } from '../../common/services/log.service';

@Component({
  moduleId: module.id,
  templateUrl: './monitor.component.html'
})
export class MonitorComponent {
  constructor(private _task: TaskService, private _log: LogService) { }

  qfilter: Array<SetterQFilter> = [{
    name: 'id',
    prop: '_id',
    type: QFilterDefType.NORMAL
  }, {
    name: 'statusId',
    prop: 'statusId',
    type: QFilterDefType.NORMAL
  }, {
    name: 'action type',
    prop: 'action.type',
    type: QFilterDefType.NORMAL
  }, {
    name: 'target',
    prop: 'action.pack.target',
    type: QFilterDefType.NORMAL
  }]

  refreshTs: number = 0;

  pageData: Task[];
  setPageData(list: Task[]) {
    this.pageData = list;
  }

  queryFn: QueryFn = (query: QueryData) => {
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

  showingTask: Task = null;
  prevShowingTask: Task = null;
  showTask(task: Task) {
    this._log.info(task);
    this.prevShowingTask = this.showingTask;
    this.showingTask = ((this.showingTask === task) ? null : task);
  }
}
