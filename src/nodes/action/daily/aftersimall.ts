
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as rtplan from '../rtplan';
import * as constant from '../../../const';
import { def } from "lavria";

export interface AfterSimAllInput {
    simAllId: string;
}

export const action = new Action<AfterSimAllInput, AfterSimAllInput, void>({
    refine: utility.id,
    validate: (input: AfterSimAllInput): boolean => {
        return utility.mongo.convObjId(input.simAllId) != null;
    },
    resolve: (input: AfterSimAllInput): bb<void> => {
        return bb.resolve().then(() => dclient.task.getOne({ _id: input.simAllId }, { statusId: 1, result: 1 }))
            .then(task => {
                if (task.statusId !== def.status.success) throw new Error(`${constant.action.simAll} task status not success: ${task.statusId}`);
                const qv = <rtplan.simall.SimAllOutput>task.result;
                if (!Array.isArray(qv.simulateTaskIdList)) throw new Error(`result of ${constant.action.simAll} not recognizable`);
                return dclient.task.createTasksHasManyPrecedence([{ action: { type: constant.action.alertsAll } }], qv.simulateTaskIdList);
            })
            .then(() => { return; });
    }
});
