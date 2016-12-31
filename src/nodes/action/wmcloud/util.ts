
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as filestorage from '../../../filestorage';
import * as config from '../../../config';
import * as datadef from '../../../datadef';

// date is day-ts if it's a number
function inputDateConv(date: Date | number): Date {
    if (date instanceof Date) return date;
    else return new Date(utility.date.dateTs2MsTs(date));
}

function normalNum(num: any, allowzero: boolean) {
    return utility.validate.isNum(num) && !isNaN(num) && isFinite(num) && (allowzero ? (num >= 0) : (num > 0));
};

const stockFields = ['openPrice', 'closePrice', 'highestPrice', 'lowestPrice', 'turnoverRate', 'preClosePrice', 'turnoverValue', 'negMarketValue', 'marketValue', 'tradeDate', 'isOpen', 'accumAdjFactor'];
const indexFields = ['openIndex', 'closeIndex', 'highestIndex', 'lowestIndex', 'preCloseIndex', 'turnoverValue', 'tradeDate'];

export function wmRaw(index: boolean, target: string, startDayTs: number, endDayTs: number): bb<{
    data: datadef.RawData,
    preEnd: number,
    count: number
}> {
    return (index ? wmIndex : wmStock)(target, startDayTs, endDayTs);
}

function wmStock(target: string, startDayTs: number, endDayTs: number): bb<{
    data: datadef.RawData,
    preEnd: number,
    count: number
}> {
    return bb.resolve()
        .then(() => datasrc.wm.market.getMktEqud(new datasrc.wm.GetMktEqudParams(target, new Date(utility.date.dateTs2MsTs(startDayTs)), new Date(utility.date.dateTs2MsTs(endDayTs)), stockFields)))
        .then(data => {
            data = data.filter(d => d.isOpen === 1);
            if (data.length === 0) return null;
            let prevdts: number = null, prevdatekey: string = null;
            const fdAccm = data[0].accumAdjFactor, vmap: { [key: string]: datadef.RawDataSlice } = {};
            for (let d of data) {
                const ratio = d.accumAdjFactor / fdAccm;
                if (!normalNum(ratio, false)) throw new Error(`bad ratio: ${ratio}`);
                const dayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(d.tradeDate));
                if (!normalNum(dayts, false)) throw new Error(`date format not recognized: ${d.tradeDate}`);
                if (prevdts != null && dayts <= prevdts) throw new Error(`data not sorted by tradeDate: ${utility.date.dateFormat(utility.date.dateTs2MsTs(prevdts))} - ${utility.date.dateFormat(utility.date.dateTs2MsTs(dayts))}`);
                const v = d.turnoverValue / 100000000;
                const tsdata: datadef.RawDataSlice = {
                    //d: dayts,
                    s: utility.num.frac(d.openPrice * ratio, 4),
                    e: utility.num.frac(d.closePrice * ratio, 4),
                    h: utility.num.frac(d.highestPrice * ratio, 4),
                    l: utility.num.frac(d.lowestPrice * ratio, 4),
                    ex: d.turnoverRate,
                    v: v < 0.1 ? v : utility.num.frac(v, 4),
                    mv: utility.num.frac(d.marketValue / 100000000, 4),
                    nr: utility.num.frac(d.negMarketValue / d.marketValue, 4)
                };
                // if (dayts === 16924 && pack.target === '300277.XSHE')
                //     tsdata.ex = 0.067;
                // else if (dayts === 16925 && pack.target === '300277.XSHE')
                //     tsdata.ex = 0.0567;
                // else if (dayts ===  16926&& pack.target === '300277.XSHE')
                //     tsdata.ex = 0.0655;
                const datekey = utility.date.dateTs2DateKey(dayts);
                if (!normalNum(tsdata.ex, true) || tsdata.ex > 1 || tsdata.nr > 1 || [tsdata.s, tsdata.e, tsdata.h, tsdata.l, tsdata.v, tsdata.mv, tsdata.nr].some(r => !normalNum(r, false))) throw new Error(`bad value: ${JSON.stringify(tsdata)}`);
                if (prevdatekey != null) {
                    const prevData = vmap[prevdatekey];
                    if (prevData.s === tsdata.s && prevData.e === tsdata.e && prevData.h === tsdata.h && prevData.l === tsdata.l)
                        throw new Error(`exactly same data in ${prevdatekey} and ${datekey}`);
                }
                vmap[datekey] = tsdata;
                prevdts = dayts;
                prevdatekey = datekey;
            }
            const maxdayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[data.length - 1].tradeDate));
            const mindayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[0].tradeDate));
            return {
                data: {
                    data: vmap,
                    minDay: utility.date.dateTs2DateKey(mindayts),
                    maxDay: utility.date.dateTs2DateKey(maxdayts)
                },
                preEnd: data[0].preClosePrice,
                count: data.length
            };
        });
}

function wmIndex(target: string, startDayTs: number, endDayTs: number): bb<{
    data: datadef.RawData,
    preEnd: number,
    count: number
}> {
    return bb.resolve()
        .then(() => datasrc.wm.market.getMktIdxd(new datasrc.wm.GetMktIdxdParams(target, new Date(utility.date.dateTs2MsTs(startDayTs)), new Date(utility.date.dateTs2MsTs(endDayTs)), indexFields)))
        .then(data => {
            if (data.length === 0) return null;
            let prevdts: number = null, prevdatekey: string = null;
            const vmap: { [key: string]: datadef.RawDataSlice } = {};
            for (let d of data) {
                const dayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(d.tradeDate));
                if (!normalNum(dayts, false)) throw new Error(`date format not recognized: ${d.tradeDate}`);
                if (prevdts != null && dayts <= prevdts) throw new Error(`data not sorted by tradeDate: ${utility.date.dateFormat(utility.date.dateTs2MsTs(prevdts))} - ${utility.date.dateFormat(utility.date.dateTs2MsTs(dayts))}`);
                const v = d.turnoverValue / 100000000;
                const tsdata: datadef.RawDataSlice = {
                    //d: dayts,
                    s: utility.num.frac(d.openIndex, 4),
                    e: utility.num.frac(d.closeIndex, 4),
                    h: utility.num.frac(d.highestIndex, 4),
                    l: utility.num.frac(d.lowestIndex, 4),
                    v: v > 0.1 ? utility.num.frac(v, 4) : v
                };
                if ([tsdata.s, tsdata.e, tsdata.h, tsdata.l, tsdata.v].some(r => !normalNum(r, false)))
                    throw new Error(`bad value: ${JSON.stringify(tsdata)}`);
                if (prevdatekey != null) {
                    const prevData = vmap[prevdatekey];
                    if (prevData.s === tsdata.s && prevData.e === tsdata.e && prevData.h === tsdata.h && prevData.l === tsdata.l)
                        throw new Error(`exactly same data in ${prevdatekey} and ${utility.date.dateFormat(utility.date.dateTs2MsTs(dayts))}`);
                }
                const datekey = utility.date.dateTs2DateKey(dayts);
                vmap[datekey] = tsdata;
                prevdts = dayts;
                prevdatekey = datekey;
            }
            const maxdayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[data.length - 1].tradeDate));
            const mindayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[0].tradeDate));
            return {
                data: {
                    data: vmap,
                    minDay: utility.date.dateTs2DateKey(mindayts),
                    maxDay: utility.date.dateTs2DateKey(maxdayts)
                },
                preEnd: data[0].preCloseIndex,
                count: data.length
            };
        });
}
