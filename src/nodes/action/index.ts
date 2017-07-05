
import { def } from 'lavria';
import * as bb from 'bluebird';
import Action from './action';
import * as wm from './wmcloud';
import * as rtplan from './rtplan';
import * as hypo from './hypothesis';
import * as rtprog from './rtprog';
import * as constant from '../../const';
import * as ctrl from './control';
import * as daily from './daily';

export function resolve(action: { type: string, pack?: any }, task: def.Task): bb<any> {
    return bb.resolve()
        .then(() => {
            const acthandler = actmap.get(action.type);
            if (acthandler == null) return bb.reject(new Error(`action not found for type: ${action.type}`));
            else return acthandler.resolve(action.pack);
        });
}

export function validate(action: { type: string, pack?: any }): boolean {
    const acthandler = actmap.get(action.type);
    return acthandler != null && acthandler.validate(action.pack);
}

const actmap = new Map<string, Action<any, any, any>>();
actmap.set(constant.action.rawInspect, wm.inspect.action);
actmap.set(constant.action.rawSync, wm.sync.action);
actmap.set(constant.action.rawData, wm.raw.action);
actmap.set(constant.action.stockList, wm.stocklist.action);
actmap.set(constant.action.simulate, rtplan.simulate.action);
actmap.set(constant.action.simAll, rtplan.simall.action);
actmap.set(constant.action.lastEnd, rtplan.lastend.action);
actmap.set(constant.action.lastEndAll, rtplan.lastendall.action);
actmap.set(constant.action.hypoTest, hypo.test.action);
actmap.set(constant.action.hypoTestAggr, hypo.aggr.action);
actmap.set(constant.action.genRtProg, rtprog.genrtprog.action);
actmap.set(constant.action.genRtProgAll, rtprog.genrtprogall.action);
actmap.set(constant.action.afterRawInspect, daily.afterRawInspect.action);
actmap.set(constant.action.afterSimAll, daily.afterSimAll.action);
actmap.set(constant.action.delay, ctrl.delay.action);
actmap.set(constant.action.alert, rtplan.alert.action);
actmap.set(constant.action.alertsAll, rtplan.alertsall.action);
actmap.set(constant.action.none, ctrl.none.action);
