
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';

export interface AlertInput {
    alertPlanId: string;
}

export interface AlertOutput {
    newAlerts: number;
}

export const action = new Action<AlertInput, AlertInput, AlertOutput>({
    refine: utility.id,
    validate: (input: AlertInput): boolean => {
        return utility.validate.valueStr(input.alertPlanId);
    },
    resolve: (input: AlertInput): bb<AlertOutput> => {
        return bb.all([
            dclient.alertplan.get({ _id: input.alertPlanId }),
            dclient.alert.getAll({ alertPlanId: input.alertPlanId })
        ])
            .then(data => {
                const alertplan = data[0], oldAlert = data[1];
                const simIdSet = new Set<string>();
                for (let a of oldAlert) simIdSet.add(makeUniqueAlertIdentifier(a.simulateId, input.alertPlanId));
                return dclient.simulate.getAll({ closed: false, rtplanId: alertplan.rtplanId })
                    .then(simulates => {
                        simulates = simulates.filter(s => !simIdSet.has(makeUniqueAlertIdentifier(s._id.toString(), input.alertPlanId)));
                        const newAlerts = simulates.filter(s => {
                            const env = new utility.prog.Env();
                            env.set('sdts', s.sdts);
                            env.set('sp', s.sp);
                            env.set('edts', s.edts);
                            env.set('ep', s.ep);
                            env.set('hdts', s.hdts);
                            env.set('hp', s.hp);
                            env.set('ldts', s.ldts);
                            env.set('lp', s.lp);
                            env.set('target', s.target);
                            return utility.prog.evaluate(alertplan.prog, env) === true;
                        }).map(s => {
                            return {
                                simulateId: s._id.toString(),
                                target: s.target,
                                alertPlanId: input.alertPlanId
                            };
                        });
                        return bb.all([
                            dclient.alert.createMul(newAlerts),
                            dclient.alert.bulkUpdate(oldAlert.filter(a => a.new).map(a => {
                                return {
                                    filter: { _id: a._id },
                                    update: { $set: { new: false } }
                                };
                            }))
                        ])
                            .then(() => {
                                return {
                                    newAlerts: newAlerts.length
                                };
                            });
                    });
            });
    }
});

function makeUniqueAlertIdentifier(simulateId: string, alertPlanId: string) {
    return `${simulateId}__${alertPlanId}`;
}
