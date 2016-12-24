import { Component } from '@angular/core';
import { Input, Action, Options, InputType } from './targetsact.component';
import { ConstService } from '../../common/services/const.service';

@Component({
  moduleId: module.id,
  templateUrl: './produce.component.html',
})
export class ProduceComponent {
  constructor(public constant: ConstService) { }

  taskTypes = [
    { type: this.constant.action.genRtProg },
    { type: this.constant.action.hypoTest },
    { type: this.constant.action.hypoTestAggr },
    { type: this.constant.action.rawData },
    { type: this.constant.action.rawInspect },
    { type: this.constant.action.rawSync },
    { type: this.constant.action.simulate },
    { type: this.constant.action.stockList }
  ].map(x => x.type);

  selectedTaskType: string = this.taskTypes[0];

  actConfig: { [key: string]: { action: Action, inputList: Array<Input>, options?: Options } } = {
    simulate: {
      action: { type: this.constant.action.simulate, bulkType: this.constant.action.simAll },
      inputList: [
        { name: 'rtplanId', title: 'RtPlan Id (empty for bulk)', type: InputType.string, bulkOnEmpty: true },
        { name: 'redo', title: 'Redo', type: InputType.bool }
      ],
      options: { locality: true }
    },
    rtprog: {
      action: { type: this.constant.action.genRtProg, bulkType: this.constant.action.genRtProgAll },
      inputList: [
        { name: 'rtplanId', title: 'RtPlan Id (empty for bulk)', type: InputType.string, bulkOnEmpty: true }
      ],
      options: { locality: true }
    }
  }
}
