
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as wmact from '../wmcloud';
import * as constant from '../../../const';
import * as config from '../../../config';
import * as ctrlact from '../control';
import * as simact from '../rtplan';
import { def } from "lavria";

export interface AfterRawInspectInput {
    rawinspectId: string;
}

export const action = new Action<AfterRawInspectInput, AfterRawInspectInput, void>({
    refine: utility.id,
    validate: (input: AfterRawInspectInput): boolean => {
        return utility.mongo.convObjId(input.rawinspectId) != null;
    },
    resolve: (input: AfterRawInspectInput): bb<void> => {
        return bb.resolve()
            .then(() => dclient.task.getOne({ _id: input.rawinspectId }, { statusId: 1, result: 1 }))
            .then(task => {
                if (task.statusId !== def.status.success) throw new Error(`${constant.action.rawInspect} task status not success: ${task.statusId}`);
                const qv = <wmact.inspect.RawInspectOutput>task.result;
                if (!Array.isArray(qv.rawSyncIdList)) throw new Error(`result of ${constant.action.rawInspect} not recognizable`);
                const simAllId = utility.mongo.newId();
                return dclient.task.createTasksHasManyPrecedence([{
                    action: {
                        type: constant.action.delay,
                        pack: <ctrlact.delay.DelayInput>{
                            delayMs: config.rawDataExpiryInMS,
                            tasks: [
                                {
                                    action: {
                                        type: constant.action.lastEndAll,
                                        pack: { targets: [] }
                                    }
                                },
                                {
                                    _id: simAllId,
                                    action: {
                                        type: constant.action.simAll,
                                        pack: <simact.simall.SimAllInput>{
                                            targets: null,
                                            rtplanId: null,
                                            redo: false,
                                            genrtprog: true
                                        }
                                    }
                                },
                                {
                                    action: { type: constant.action.afterSimAll, pack: { simAllId: simAllId } },
                                    condition: { type: 'success', pack: simAllId }
                                }
                            ]
                        }
                    }
                }], qv.rawSyncIdList)
            })
            .then(() => { return; });
    }
});
