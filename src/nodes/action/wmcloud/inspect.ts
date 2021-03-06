
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as config from '../../../config';
import * as log from '../../../log';
import * as dclient from '../../dclient';
import * as constant from '../../../const';

export interface RawInspectOutput {
    allstocks: number;
    allidx: number;
    rawSyncIdList: Array<string>;
}

export const action = new Action<void, void, RawInspectOutput>({
    refine: utility.noop,
    validate: utility.validate.alwaysTrue,
    resolve: (): bb<RawInspectOutput> => {
        return datasrc.mine.meta.stock.get()
            .then(stocks => {
                const all = stocks.map(s => { return { target: s.target, index: false }; }).concat(config.maintainIdx.map(i => { return { target: i, index: true }; }));
                log.info(`rawinspect: ${stocks.length} stocks loaded`);
                log.info(`rawinspect: ${config.maintainIdx.length} indexes loaded`);
                log.info(`rawinspect: ${all.length} totally loaded`);
                return dclient.task.createMul(all.map(a => {
                    return {
                        action: { type: constant.action.rawSync, pack: { target: a.target, index: a.index } },
                        comments: `rawsync: ${a.target}`
                    };
                }))
                    .then(idlist => {
                        return { allstocks: stocks.length, allidx: config.maintainIdx.length, rawSyncIdList: idlist.list };
                    });
            });
    }
});
