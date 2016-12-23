
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as _ from 'lodash';
import * as dclient from '../../dclient';
import * as nutil from '../../util';
import * as datasrc from '../../../datasrc';
import * as config from '../../../config';
import * as constant from '../../../const';

export interface GenRtProgAllInput {
    targets: Array<string>;
    rtplanId: string;
}

export interface GenRtProgAllOutput {
    targetsCount: number;
    rtplansCount: number;
    rtplansMatch: Array<{ ct: number; rtplanId: string }>;
    total: number;
}

export const action = new Action<GenRtProgAllInput, GenRtProgAllInput, GenRtProgAllOutput>({
    refine: utility.id,
    validate: (input: GenRtProgAllInput): boolean => {
        return Array.isArray(input.targets) && input.targets.every(utility.validate.valueStr) && (input.rtplanId == null || utility.validate.valueStr(input.rtplanId));
    },
    resolve: (input: GenRtProgAllInput): bb<GenRtProgAllOutput> => {
        const rtpCount = new Array<{ rtplanId: string, ct: number }>();
        return bb.all([
            input.targets.length === 0 ? datasrc.mine.meta.stock.getNames().then(stocks => stocks.concat(config.maintainIdx)) : bb.resolve(input.targets),
            input.rtplanId ? dclient.rtplan.getAll({ _id: input.rtplanId, runrt: true }) : dclient.rtplan.getAll({ runrt: true })
        ])
            .then(data => {
                const targets = data[0], rtplans = data[1];
                const dataset = _.flatten(rtplans.map(rtplan => {
                    const ret = targets.filter(target => nutil.rtplanScopeContains(target, rtplan.targetScope))
                        .map(target => {
                            return {
                                target: target,
                                rtplanId: rtplan._id,
                                //runrt: rtplan.runrt
                            };
                        });
                    rtpCount.push({ rtplanId: rtplan._id, ct: ret.length });
                    return ret;
                }));

                return (dataset.length > 0 ? <bb<any>>dclient.task.createMul(dataset.map(d => {
                    return {
                        action: { type: constant.action.genRtProg, pack: { rtplanId: d.rtplanId, target: d.target } },
                        locality: { target: d.target }
                    };
                })) : bb.resolve())
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
