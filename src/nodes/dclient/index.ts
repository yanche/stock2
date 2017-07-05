
import * as rtplan from './rtplan';
import * as rtprice from './rtprice';
import * as rtprog from './rtprog';
import * as rtprogout from './rtprogout';
import * as simtrack from './simtrack';
import * as simulate from './simulate';
import * as alertplan from './alertplan';
import * as alert from './alert';
import { client, def } from "lavria";
import * as config from "../../config";
import * as utility from "../../utility";
import * as constant from "../../const";

const taskNoneStep = 1000;
const longConstraints = { timeoutLevel: def.constraints.timeoutLevel.long.code, conditionCheckInterval: def.constraints.conditionCheckInterval.long.code, ttl: 1 };
class DispatcherClient extends client.DispatcherClient {
    public createTasksHasManyPrecedence(list: Array<TaskCreation>, idList: Array<string>) {
        list.forEach(l => l.condition = l.constraints = null);
        if (idList.length === 0) {
            return this.createMul(list);
        }
        if (idList.length <= taskNoneStep) {
            return this.createMul(list.map(l => {
                l.condition = { type: def.cond.success, pack: idList };
                l.constraints = longConstraints;
                return l;
            }));
        }
        const idSplit = new Array<Array<string>>();
        let i = 0;
        while (i < idList.length) {
            const e = i + taskNoneStep;
            idSplit.push(idList.slice(i, e));
            i = e;
        }
        const tasksToCreate = new Array<TaskCreation>();
        const presenterTaskIds = new Array<string>();
        idSplit.forEach(s => {
            const tid = utility.mongo.newId().toHexString();
            presenterTaskIds.push(tid);
            tasksToCreate.push({
                _id: tid,
                action: { type: constant.action.none },
                condition: { type: def.cond.success, pack: s },
                constraints: longConstraints
            });
        });
        const hubTid = utility.mongo.newId().toHexString();
        tasksToCreate.push({
            _id: hubTid,
            action: { type: constant.action.none },
            constraints: longConstraints,
            condition: { type: def.cond.success, pack: presenterTaskIds }
        })
        list.forEach(l => {
            l.constraints = longConstraints;
            l.condition = { type: def.cond.success, pack: hubTid };
            tasksToCreate.push(l);
        });
        return this.createMul(tasksToCreate);
    }

}

export const task = new DispatcherClient(config.dispatcherHost, config.dispatcherPort);
export type TaskCreation = client.TaskCreation
export { rtplan, rtprice, rtprog, rtprogout, simtrack, simulate, alert, alertplan }
