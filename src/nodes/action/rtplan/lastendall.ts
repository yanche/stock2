
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as datasrc from '../../../datasrc';
import * as config from '../../../config';
import * as constants from '../../../const';

export interface LastEndInput {
    targets: Array<string>;
}

export const action = new Action<LastEndInput, LastEndInput, void>({
    refine: utility.id,
    validate: (input: LastEndInput): boolean => {
        return input.targets == null || Array.isArray(input.targets);
    },
    resolve: (input: LastEndInput): bb<void> => {
        let prmtargets: bb<Array<string>>;
        if ((input.targets || []).length === 0) {
            prmtargets = datasrc.mine.meta.stock.getNames()
                .then(names => names.concat(config.maintainIdx));
        }
        else prmtargets = bb.resolve(input.targets);
        return prmtargets.then(targets => {
            return dclient.task.createMul(targets.map(target => {
                return {
                    action: { type: constants.action.lastEnd, pack: { target: target } },
                    locality: { target: target }
                };
            }));
        })
            .then(() => null);
    }
});
