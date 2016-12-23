
import * as bb from 'bluebird';
import * as logic from './logic';
import success from './success';
import complete from './complete';
import ok from './ok';
import timer from './timer';
import * as constant from '../../../const';

export interface Condition {
    resolve(pack: any): bb<boolean>;
    validate(pack: any): boolean;
}

export function resolve(cond: { type: string, pack?: any }): bb<boolean> {
    return bb.resolve()
        .then(() => {
            const condhandler = condmap.get(cond.type);
            if (condhandler == null) return bb.reject(new Error(`condition not found for type: ${cond.type}`));
            else return condhandler.resolve(cond.pack);
        });
}

export function validate(cond: { type: string, pack?: any }): boolean {
    const condhandler = condmap.get(cond.type);
    return condhandler != null && condhandler.validate(cond.pack);
}

const condmap = new Map<string, Condition>();
condmap.set(constant.dispatcherCond.ok, ok);
condmap.set(constant.dispatcherCond.success, success);
condmap.set(constant.dispatcherCond.complete, complete);
condmap.set(constant.dispatcherCond.timer, timer);
condmap.set(constant.dispatcherCond.or, logic.or);
condmap.set(constant.dispatcherCond.and, logic.and);