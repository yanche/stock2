
import * as i from './index';
import * as bb from 'bluebird';

function validate(pack: Array<{ type: string, pack?: any }>): boolean {
    return Array.isArray(pack) && pack.length > 1 && pack.every(i.validate);
}

const and: i.Condition = {
    resolve(pack: Array<{ type: string, pack?: any }>): bb<boolean> {
        if (validate(pack)) return bb.all(pack.map(i.resolve)).then(d => d.every(x => x === true));
        else return bb.reject(new Error('condition.and: bad input'));
    },
    validate: validate
}

const or: i.Condition = {
    resolve(pack: Array<{ type: string, pack?: any }>): bb<boolean> {
        if (validate(pack)) return bb.all(pack.map(i.resolve)).then(d => d.some(x => x === true));
        else return bb.reject(new Error('condition.or: bad input'));
    },
    validate: validate
}

export {and, or};
