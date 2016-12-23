
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as _ from 'lodash';
import * as dclient from '../../dclient';
import * as nutil from '../../util';
import * as datasrc from '../../../datasrc';
import * as config from '../../../config';
import * as constant from '../../../const';
import * as sim from './simulate';
import * as rtprogact from '../rtprog';

export interface SimAllInput {
    targets: Array<string>;
    rtplanId: string;
    redo: boolean;
    genrtprog: boolean;
}

export interface SimAllOutput {
    targetsCount: number;
    rtplansCount: number;
    rtplansMatch: Array<{ ct: number; rtplanId: string }>;
    total: number;
}

export const action = new Action<SimAllInput, SimAllInput, SimAllOutput>({
    refine: utility.id,
    validate: (input: SimAllInput): boolean => {
        return (input.targets == null || (Array.isArray(input.targets) && input.targets.every(utility.validate.valueStr))) && (input.rtplanId == null || utility.validate.valueStr(input.rtplanId)) && utility.validate.isBool(input.redo);
    },
    resolve: (input: SimAllInput): bb<SimAllOutput> => {
        const rtpCount = new Array<{ rtplanId: string, ct: number }>();
        return bb.all([
            (input.targets || []).length === 0 ? datasrc.mine.meta.stock.getNames().then(stocks => stocks.concat(config.maintainIdx)) : bb.resolve(input.targets),
            input.rtplanId ? dclient.rtplan.getAll({ _id: input.rtplanId }) : dclient.rtplan.getAll({})
        ])
            .then(data => {
                const targets = data[0], rtplans = data[1];
                const dataset = _.flatten(rtplans.map(rtplan => {
                    const ret = targets.filter(target => nutil.rtplanScopeContains(target, rtplan.targetScope))
                        .map(target => {
                            return {
                                target: target,
                                rtplanId: rtplan._id,
                                runrt: rtplan.runrt
                            };
                        });
                    rtpCount.push({ rtplanId: rtplan._id, ct: ret.length });
                    return ret;
                }));

                return (dataset.length > 0 ? <bb<any>>dclient.task.createMul(_.flatten(dataset.map(d => {
                    const taskId = utility.mongo.newId();
                    const ret: Array<dclient.task.TaskCreation> = [{
                        _id: taskId,
                        action: { type: constant.action.simulate, pack: <sim.SimulateInput>{ rtplanId: d.rtplanId, target: d.target, redo: input.redo } },
                        locality: { target: d.target }
                    }];
                    if (d.runrt && input.genrtprog) {
                        ret.push({
                            action: { type: constant.action.genRtProg, pack: <rtprogact.genrtprog.GenRtProgInput>{ target: d.target, rtplanId: d.rtplanId } },
                            locality: { target: d.target },
                            condition: { type: constant.dispatcherCond.success, pack: taskId }
                        });
                    }
                    return ret;
                }))) : bb.resolve())
                    .then(() => {
                        return {
                            targetsCount: targets.length,
                            rtplansCount: rtplans.length,
                            rtplansMatch: rtpCount,
                            total: dataset.length
                        };
                    });
            });
    }
});
