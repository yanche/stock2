
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
    nodata: boolean,
    newpull: boolean
}

function sync(index: boolean, target: string, rawdata: datadef.RawData): bb<SyncOutput> {
    const todayDateTs = utility.date.msTs2DateTs(utility.date.nowUTCTs());
    // 其实这里可以直接用 utility.date.dateKey2DateTs(rawdata.maxDay) + 1
    // 因为即使请求的日期超过了180天（wmcloud提供给试用的历史数据获取范围是当日回溯180天） wmcloud不会报错 只不过超过部分全都是返回空而已
    // 除非有特长时间(180天)的job没有跑这个sync task 不然这180是足够安全的 不会出现数据缺失
    // 假设今天是第1000天 通联提供第820-1000天的数据
    // 对于最后一个股票交易日为820之后的股票是安全的
    // 对于820之前的 比如720日为最后在案交易日的股票
    // 除非720-820之间有实际交易数据 不然也是安全的
    // 而这一段之间有实际交易 但却没有被提前记录的原因
    // 是720-900这一段时间（900那一天可以回溯到720的数据）都没有跑sync task
    // 因此这几乎没有风险
    const startDateTs = Math.max(todayDateTs - config.wmTrialDays, utility.date.dateKey2DateTs(rawdata.maxDay) + 1);
    return rutil.wmRaw(index, target, startDateTs, todayDateTs)
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
                            newpull: false,
                            drop: drop,
                            ratio: ratio,
                            delta: { maxDay: r.data.maxDay, minDay: r.data.minDay },
                            origin: origin,
                            nodata: false
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
                    return rutil.wmRaw(pack.index, pack.target, utility.date.dateTs(2000, 0, 1), utility.date.msTs2DateTs(utility.date.nowUTCTs()))
                        .then(d => {
                            if (d == null || d.count === 0) return { nodata: true, newpull: true };
                            else {
                                return datasrc.mine.targetData.upload(pack.target, d.data)
                                    .then(drop => {
                                        return <SyncOutput>{
                                            newpull: true,
                                            drop: drop,
                                            delta: { maxDay: d.data.maxDay, minDay: d.data.minDay },
                                            nodata: false
                                        };
                                    });
                            }
                        });
                }
                else throw new Error(`error in loading raw data: ${reply.statusCode}, ${pack.target}`);
            });
    }
});
