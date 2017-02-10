
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';

export const action = new Action<void, void, void>({
    refine: utility.id,
    validate: utility.validate.alwaysTrue,
    resolve: (): bb<void> => {
        return bb.resolve();
    }
});
