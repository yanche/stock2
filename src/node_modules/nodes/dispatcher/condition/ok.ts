
import * as i from './index';
import * as bb from 'bluebird';

const ok:i.Condition = {
    resolve(pack: any): bb<boolean> {
        return bb.resolve(true);
    },
    validate(pack: any): boolean {
        return true;
    }
}

export default ok;
