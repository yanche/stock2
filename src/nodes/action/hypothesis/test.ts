
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as config from '../../../config';
import * as log from '../../../log';
import * as _ from 'lodash';
import * as filestorage from '../../../filestorage';
import * as datapvd from '../../../datapvd';
import * as tester from '../../../tester';
import * as hutil from './util';

export interface HypoTestInput {
    header: boolean;
    target: string;
    penum: utility.hypo.PEnum;
    cpDefRef: datapvd.literal.LiteralDP;
    cpoutDefRefs: { [key: string]: datapvd.literal.LiteralDP };
    envDefs: { [key: string]: datapvd.literal.LiteralDP };
}

export interface HypoTestOutput {
    drops: Array<{ name: string, drop: filestorage.common.FileStorage }>
}

export const action = new Action<HypoTestInput, HypoTestInput, HypoTestOutput>({
    refine: utility.id,
    validate: (input: HypoTestInput): boolean => {
        const v1 = utility.validate.isObj(input) && utility.validate.isBool(input.header) && utility.validate.isStr(input.target) && input.target.length > 0 && input.target.trim().length === input.target.length
            && utility.hypo.isPEnum(input.penum) && utility.validate.isObj(input.cpDefRef) && utility.validate.isObj(input.cpoutDefRefs) && utility.validate.isObj(input.envDefs);
        if (v1) {
            let ct = 0;
            for (let k in input.cpoutDefRefs) {
                ++ct;
                if (!utility.validate.isObj(input.cpoutDefRefs[k])) return false;
            }
            if (ct === 0) return false;
            for (let k in input.envDefs) {
                if (!utility.validate.isObj(input.envDefs[k])) return false;
            }
            return true;
        }
        else return false;
    },
    resolve: (input: HypoTestInput): bb<HypoTestOutput> => {
        return bb.all([
            datapvd.literal.resolve({ type: 'r.end', pack: input.target }),
            bb.all(config.maintainIdx.map(idx => datapvd.literal.resolve({ type: 'r.end', pack: idx })))
        ])
            .then(data => { //rdp: dp for revenue calculation
                const rdp = data[0], idxdps = data[1];
                const em = new utility.hypo.MapEnumerator(input.penum);
                let p = em.current(), total = em.total(), finished = 0, results: Array<{ params: { [key: string]: any }, hits: Array<tester.hypo.HypoRec> }> = [];
                //part 1: calculate hypothesis
                return utility.whileLoop(() => bb.resolve(finished < total), () => {
                    log.info(`[${input.target} hypotest] progress: ${utility.num.frac(finished / total * 100, 2)}%`)
                    return bb.all([datapvd.literal.resolve(utility.refReplace(input.cpDefRef, p)), resolveDPs(input.cpoutDefRefs, p), resolveDPs(input.envDefs)])
                        .then(data => {
                            const mindayts = rdp.forwardTs(rdp.minTs, 20); //上市前20天忽略
                            if (mindayts == null) results.push({ params: p, hits: new Array<tester.hypo.HypoRec>() });
                            else {
                                return tester.hypo.run({
                                    target: input.target,
                                    dp: data[0],
                                    dpouts: data[1],
                                    envdps: data[2],
                                    glong: p['glong'],
                                    minDateTs: Math.max(mindayts, utility.date.msTs2DateTs(Date.UTC(1992, 0, 1))),
                                    maxDateTs: rdp.maxTs
                                })
                                    .then(hypos => results.push({ params: p, hits: hypos }));
                            }
                        })
                        .then(() => {
                            finished++;
                            if (finished < total) {
                                em.next();
                                p = em.current();
                            }
                            else p = null;
                        });
                })
                    //part 2: analysis calculation
                    .then(() => {
                        let outct = 0, notclosed = 0, retprms = new Array<bb<{ name: string, drop: filestorage.common.FileStorage }>>();;
                        for (let dpoutname in input.cpoutDefRefs) {
                            const testSumLines = new Array<string>();
                            for (let result of results) {
                                for (let h of result.hits) {
                                    const rec = h.outrecs[outct];
                                    if (rec.ets == null) {
                                        ++notclosed;
                                        continue; //not closed trade
                                    }
                                    const items: Array<any> = [];
                                    items.push(input.target); //target
                                    items.push(utility.date.dateFormat(utility.date.dateTs2MsTs(h.sts))); //start date
                                    items.push(utility.date.dateFormat(utility.date.dateTs2MsTs(rec.ets)));//end date
                                    items.push(rec.ets - h.sts); //periods
                                    items.push(utility.num.frac(rec.rev, 4));
                                    items.push(utility.date.dateFormat(utility.date.dateTs2MsTs(rec.hts))); //highest date
                                    items.push(rec.hts - h.sts); //days to highest
                                    items.push(utility.num.frac(tester.hypo.rev(result.params['glone'], h.sp, rec.hp), 4)); //rev at highest price
                                    items.push(utility.date.dateFormat(utility.date.dateTs2MsTs(rec.lts))); //lowest date
                                    items.push(rec.lts - h.sts); //days to lowest
                                    items.push(utility.num.frac(tester.hypo.rev(result.params['glone'], h.sp, rec.lp), 4)); //rev at lowest price
                                    for (let idxdp of idxdps) {
                                        if (idxdp.hasDef(h.sts))
                                            items.push(utility.num.frac(tester.hypo.rev(result.params['glong'], idxdp.get(h.sts), idxdp.get(rec.ets)), 4));
                                        else
                                            items.push(null);
                                    }
                                    for (let i in result.params)
                                        items.push(result.params[i]);
                                    for (let i in h.envs)
                                        items.push(frac4IfNum(h.envs[i]));
                                    testSumLines.push(items.join(','));
                                }
                            }
                            let allcontent = testSumLines.join('\r\n') + '\r\n';
                            if (input.header) allcontent = hutil.reportHeaders(input.penum, input.envDefs) + '\r\n' + allcontent;
                            retprms.push(filestorage.common.writeTempBytes(allcontent, `${utility.randomStr()}.csv`).then(drop => { return { drop: drop, name: dpoutname }; }));
                            ++outct;
                        }
                        return bb.all(retprms);
                    })
                    .then(drops => {
                        return { drops: drops };
                    });
            });
    }
});

function frac4IfNum(n: any) {
    return utility.validate.isNum(n) && Math.abs(n) > 0.01 ? utility.num.frac(n, 4) : n;
}

function resolveDPs(dpl: { [key: string]: datapvd.literal.LiteralDP }, repl?: { [key: string]: any }) {
    const prms: Array<bb<{ name: string, dp: datapvd.def.DataPvd<any> }>> = [];
    for (let i in dpl) {
        const v = dpl[i];
        prms.push(datapvd.literal.resolve(<datapvd.literal.LiteralDP>(repl == null ? v : utility.refReplace(v, repl))).then(pvd => {
            return { name: i, dp: pvd };
        }));
    }
    return bb.all(prms);
}
