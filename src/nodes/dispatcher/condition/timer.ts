
import * as i from './index';
import * as bb from 'bluebird';
import * as utility from '../../../utility';

const timer: i.Condition = {
    resolve(pack: number): bb<boolean> {
    if (!timer.validate(pack))
        return bb.reject(new Error(`condition.timer, bad input: ${pack}`));
    else
        return bb.resolve(new Date().getTime() >= pack);
    },
    validate(pack: number): boolean {
        return utility.validate.nonNegNum(pack, true) && (new Date(pack).getTime() === pack);
    }
}

export default timer;
