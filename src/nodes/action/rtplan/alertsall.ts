
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as constant from '../../../const';

export interface AlertsAllOutput {
    count: number;
}

export const action = new Action<void, void, AlertsAllOutput>({
    refine: utility.id,
    validate: utility.validate.alwaysTrue,
    resolve: (): bb<AlertsAllOutput> => {
        const rtpCount = new Array<{ rtplanId: string, ct: number }>();
        return dclient.alertplan.getAll({})
            .then(alertplans => {
                return dclient.task.createMul(alertplans.map(alertplan => {
                    return {
                        action: { type: constant.action.alert, pack: { alertPlanId: alertplan._id } }
                    };
                }))
                    .then(() => {
                        return {
                            count: alertplans.length
                        };
                    });
            });
    }
});
