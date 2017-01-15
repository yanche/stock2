
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as nutil from '../../util';
import * as datapvd from '../../../datapvd';

export interface GenRtProgInput {
    target: string;
    rtplanId: string;
}

export interface GenRtProgOutput {
    simulatesCount: number;
    rtprogDone: boolean;
}

export const action = new Action<GenRtProgInput, GenRtProgInput, GenRtProgOutput>({
    refine: utility.id,
    validate: (input: GenRtProgInput): boolean => {
        return utility.validate.valueStr(input.rtplanId) && utility.validate.valueStr(input.target);
    },
    resolve: (input: GenRtProgInput): bb<GenRtProgOutput> => {
        let rtprogdone = false, targetMaxTs: number = null;
        return dclient.rtplan.get({ _id: input.rtplanId })
            .then(rtplan => {
                if (rtplan == null) throw new Error(`rtplan not found for id: ${input.rtplanId}`);
                if (!rtplan.runrt) throw new Error(`rtplan not configured to run rtprog: ${input.rtplanId}`);
                if (!nutil.rtplanScopeContains(input.target, rtplan.targetScope)) throw new Error(`rtplan scope does not contain given target: ${input.rtplanId}, ${input.target}`);

                const rtprogFilter = { target: input.target, rtplanId: input.rtplanId };
                return bb.all([
                    dclient.rtprog.remove(rtprogFilter),
                    dclient.rtprogout.remove(rtprogFilter),
                    datapvd.literal.resolve({ type: 'r.end', pack: input.target })
                ])
                    .then(data => {
                        const epvd = <datapvd.def.DataPvd<number>>data[2];
                        targetMaxTs = epvd.maxTs;
                        if (epvd.forwardTs(epvd.minTs, 20) != null && targetMaxTs >= rtplan.startDateTs) {
                            return datapvd.literal.resolve(utility.refReplace(rtplan.cpdefRef, { target: input.target }))
                                .then(dp => {
                                    if (dp.hasDefProg()) {
                                        return dclient.rtprog.create({ target: input.target, rtprog: dp.getRTProg(), rtplanId: input.rtplanId, glong: rtplan.glong })
                                            .then(() => rtprogdone = true);
                                    }
                                    else {
                                        rtprogdone = false;
                                    }
                                });
                        }
                    })
                    .then(() => dclient.simulate.getAll({ target: input.target, rtplanId: input.rtplanId, closed: false }))
                    .then(sims => {
                        const corrupted = sims.filter(sim => (sim.edts || sim.sdts) !== targetMaxTs);
                        if (corrupted.length > 0) throw new Error(`simulate.ets or sts does not match target's max-date-ts, ${corrupted.length}, ${input.target}, ${input.rtplanId}`);
                        return datapvd.literal.resolve(utility.refReplace(rtplan.cpoutdefRef, { target: input.target }))
                            .then(dpout => dclient.rtprogout.createMul(sims.map(sim => {
                                return {
                                    target: input.target,
                                    rtplanId: input.rtplanId,
                                    sdts: sim.sdts,
                                    sp: sim.sp,
                                    hdts: sim.hdts,
                                    hp: sim.hp,
                                    ldts: sim.ldts,
                                    lp: sim.lp,
                                    rtprog: dpout.getRTProg(),
                                    glong: sim.glong
                                };
                            })))
                            .then(() => {
                                return {
                                    rtprogDone: rtprogdone,
                                    simulatesCount: sims.length
                                };
                            });
                    });
            });
    }
});
