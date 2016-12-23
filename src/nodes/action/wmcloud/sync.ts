
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as filestorage from '../../../filestorage';
import * as config from '../../../config';
import * as dclient from '../../dclient';
import * as datapvd from '../../../datapvd';
import * as rutil from './util';
import * as datadef from '../../../datadef';

export interface SyncInput {
    target: string;
    index: boolean;
}

export interface SyncOutput {
    drop?: filestorage.common.FileStorage,
    ratio?: number,
    delta?: { maxDay: string, minDay: string },
    origin?: { maxDay: string, minDay: string },
    nodata?: boolean
}

function sync(index: boolean, target: string, rawdata: datadef.RawData): bb<SyncOutput> {
    return rutil.wmRaw(index, target, utility.date.dateKey2DateTs(rawdata.maxDay) + 1, utility.date.msTs2DateTs(utility.date.nowUTCTs()))
        .then(r => {
            if (r != null && r.count > 0) {
                const data = r.data.data, ratio = rawdata.data[rawdata.maxDay].e / r.preEnd;
                for (let d in data) {
                    const r = data[d];
                    rawdata.data[d] = {
                        s: utility.num.frac(r.s * ratio, 4),
                        e: utility.num.frac(r.e * ratio, 4),
                        h: utility.num.frac(r.h * ratio, 4),
                        l: utility.num.frac(r.l * ratio, 4),
                        ex: r.ex,
                        v: r.v,
                        mv: r.mv,
                        nr: r.nr
                    };
                }
                const origin = { maxDay: rawdata.maxDay, minDay: rawdata.minDay };
                rawdata.maxDay = r.data.maxDay;
                return datasrc.mine.targetData.upload(target, rawdata)
                    .then(drop => {
                        return <SyncOutput>{
                            drop: drop,
                            ratio: ratio,
                            delta: { maxDay: r.data.maxDay, minDay: r.data.minDay },
                            origin: origin
                        };
                    });
            }
            else return <SyncOutput>{ nodata: true };
        });
}

export const action = new Action({
    refine: (raw: SyncInput): SyncInput => { return raw; },
    validate: (pack: SyncInput): boolean => {
        return utility.validate.isStr(pack.target) && pack.target.length > 0 && utility.validate.isBool(pack.index);
    },
    resolve: (pack: SyncInput): bb<SyncOutput> => {
        return datasrc.mine.targetData.get(pack.target)
            .then(reply => {
                if (reply.statusCode === 200) return sync(pack.index, pack.target, reply.data);
                else if (reply.statusCode === 404) {
                    return rutil.wmRaw(pack.index, pack.target, utility.date.dateTs(1990, 0, 1), utility.date.msTs2DateTs(utility.date.nowUTCTs()))
                        .then(d => {
                            if (d == null || d.count === 0) return { nodata: true };
                            else {
                                return datasrc.mine.targetData.upload(pack.target, d.data)
                                    .then(drop => {
                                        return <SyncOutput>{
                                            drop: drop,
                                            delta: { maxDay: d.data.maxDay, minDay: d.data.minDay }
                                        };
                                    });
                            }
                        });
                }
                else throw new Error(`error in loading raw data: ${reply.statusCode}, ${pack.target}`);
            });
    }
});
