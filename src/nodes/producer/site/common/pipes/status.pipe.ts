import { Pipe, PipeTransform } from '@angular/core';
import { ConstService } from '../services/const.service';

@Pipe({ name: 'status' })
export class StatusPipe implements PipeTransform {
    constructor(private _const: ConstService) { }

    transform(statusId: number): string {
        switch (statusId) {
            case this._const.status.abandoned: return 'Abandoned';
            case this._const.status.closed: return 'Closed';
            case this._const.status.conditionCheckInterval: return 'ConditionCheckInterval';
            case this._const.status.failed: return 'Failed';
            case this._const.status.new: return 'New';
            case this._const.status.prepared: return 'Prepared';
            case this._const.status.processing: return 'Processing';
            case this._const.status.success: return 'Success';
            case this._const.status.timeout: return 'Timeout';
            default: return '';
        }
    }
}
