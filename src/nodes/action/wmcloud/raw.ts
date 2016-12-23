
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as filestorage from '../../../filestorage';
import * as config from '../../../config';
import * as datadef from '../../../datadef';
import * as rutil from './util';

// date is day-ts if it's a number
function inputDateConv(date: Date | number): Date {
    if (date instanceof Date) return date;
    else return new Date(utility.date.dateTs2MsTs(date));
}

export interface RawInput {
    target: string;
    index: boolean;
    start?: string;
    end?: string;
}

interface RawRefinedInput {
    target: string;
    index: boolean;
    startDayTs: number;
    endDayTs: number;
}

export interface RawOutput {
    nodata?: boolean;
    rawdata?: datadef.RawData;
    drop?: filestorage.common.FileStorage
}

export const action = new Action({
    refine: (raw: RawInput): RawRefinedInput => {
        return {
            target: (raw.target || '').trim(),
            index: raw.index,
            startDayTs: utility.date.msTs2DateTs(raw.start == null ? Date.UTC(1991, 0, 1) : utility.date.dashDateStrParse(raw.start)),
            endDayTs: utility.date.msTs2DateTs(raw.end == null ? utility.date.nowUTCTs() : utility.date.dashDateStrParse(raw.end))
        }
    },
    validate: (pack: RawRefinedInput): boolean => {
        return utility.validate.isStr(pack.target) && pack.target.length > 0 && utility.validate.isBool(pack.index)
            && utility.validate.posInt(pack.startDayTs) && utility.validate.posInt(pack.endDayTs) && pack.startDayTs <= pack.endDayTs;
    },
    resolve: (pack: RawRefinedInput): bb<RawOutput> => {
        return rutil.wmRaw(pack.index, pack.target, pack.startDayTs, pack.endDayTs)
            .then(data => {
                if (data == null || data.count === 0) return { nodata: true };
                else if (data.count >= 10) return filestorage.azure.upload(JSON.stringify(data.data), `${utility.randomStr()}.json`, null, config.azurestorage.container.temp)
                    .then(drop => { return <RawOutput>{ nodata: false, drop: drop } });
                else return <RawOutput>{
                    nodata: false,
                    rawdata: data.data
                }
            });
    }
});
