
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as log from '../../../log';
import * as _ from 'lodash';
import * as filestorage from '../../../filestorage';
import * as dclient from '../../dclient';
import * as hutil from './util';
import * as test from './test';
import { def } from "lavria";
import roll from "croll";

export interface AggrInput {
    ids: Array<string>;
    paramNames: Array<string>;
    envNames: Array<string>;
    cpoutNames: Array<string>;
    filename: string;
}

export interface AggrOutput {
    drops: Array<{ name: string, drop: filestorage.common.FileStorage }>;
    meta: { total: number, validTotal: number };
}

export const action = new Action<AggrInput, AggrInput, AggrOutput>({
    refine: utility.id,
    validate: (input: AggrInput): boolean => {
        return strListValidate(input.ids) && input.ids.length > 0
            && strListValidate(input.paramNames)
            && strListValidate(input.envNames)
            && strListValidate(input.cpoutNames) && input.cpoutNames.length > 0
            && (input.filename == null || utility.validate.isStr(input.filename));
    },
    resolve: (input: AggrInput): bb<AggrOutput> => {
        return bb.resolve().then(() => dclient.task.getAllById(input.ids, { result: 1 }))
            .then(data => {
                const qvarr = data.list.filter(t => t.result != null).map(t => <test.HypoTestOutput>t.result), bufmap = new Map<string, { fname: string, bufs: Array<Buffer> }>();
                for (let cpoutname of input.cpoutNames) {
                    const fname = `hypoaggr/${(input.filename || '').trim() || utility.randomStr()}_${cpoutname}.csv`;
                    bufmap.set(cpoutname, { fname: fname, bufs: [new Buffer([0xef, 0xbb, 0xbf]), new Buffer(hutil.reportHeaders(input.paramNames, input.envNames) + '\r\n')] });
                }
                const errs = new Array<Error>();
                return roll(qvarr, (qv): Promise<void> => {
                    return Promise.all(qv.drops.map(d => {
                        const bufcache = bufmap.get(d.name);
                        if (bufcache == null) throw new Error(`dpout name in hypotest result does not match input of hypoaggr: ${d.name}`);
                        return d.drop == null ? bb.resolve(0) : filestorage.common.getBytes(d.drop).then(bytes => bufcache.bufs.push(bytes));
                    }))
                        .catch((err: Error) => {
                            log.error(err.stack);
                            errs.push(err);
                        })
                        .then(() => null);
                }, Math.min(10, qvarr.length))
                    .then(() => {
                        if (errs.length > 0) throw errs[0];
                        return bb.all(input.cpoutNames.map(cpoutname => {
                            const bufcache = bufmap.get(cpoutname);
                            return filestorage.common.writeTempBytes(Buffer.concat(bufcache.bufs), bufcache.fname)
                                .then(drop => {
                                    return {
                                        drop: drop,
                                        name: cpoutname
                                    };
                                });
                        }));
                    })
                    .then(data => {
                        return {
                            meta: { total: input.ids.length, validTotal: qvarr.length },
                            drops: data
                        }
                    });
            });
    }
});

function strListValidate(strs: Array<string>): boolean {
    return Array.isArray(strs) && strs.every(str => utility.validate.isStr(str) && str.length > 0 && str.trim().length === str.length) && _.uniq(strs).length === strs.length;
}
