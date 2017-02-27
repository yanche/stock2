
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

function badExRate(ex: number, dayts: number, target: string): boolean {
    if (ex < 1) return false;
    target = target.toLowerCase();
    if (dayts === 8848 && target === '601607.xshg') return false;
    else if ((dayts === 8880 || dayts === 8883) && target === '600857.xshg') return false;
    else if (dayts === 9001 && target === '600867.xshg') return false;
    else if ((dayts === 8986 || dayts === 8987) && target === '600864.xshg') return false;
    else if (dayts === 8986 && target === '600865.xshg') return false;
    else if (dayts === 8995 && target === '600866.xshg') return false;
    else if (dayts === 8848 && target === '600850.xshg') return false;
    else if (dayts === 8848 && target === '600847.xshg') return false;
    else if (dayts === 8880 && target === '600855.xshg') return false;
    else if (dayts === 8905 && target === '600862.xshg') return false;
    else if (dayts === 8848 && target === '600848.xshg') return false;
    else if (dayts === 8859 && target === '600851.xshg') return false;
    else if (dayts === 8834 && target === '600836.xshg') return false;
    else if (dayts === 8835 && target === '600843.xshg') return false;
    else if (dayts === 8835 && target === '600845.xshg') return false;
    else if (dayts === 8835 && target === '600841.xshg') return false;
    else if (dayts === 8835 && target === '600844.xshg') return false;
    else if (dayts === 8835 && target === '600846.xshg') return false;
    else if (dayts === 8835 && target === '600864.xshg') return false;
    else if (dayts === 8981 && target === '600863.xshg') return false;
    else if (dayts === 8873 && target === '600613.xshg') return false;
    else if (dayts === 8981 && target === '600651.xshg') return false;
    else if (dayts === 8855 && target === '600614.xshg') return false;
    else if (dayts === 9006 && target === '600648.xshg') return false;
    else if (dayts === 8981 && target === '600653.xshg') return false;
    else if (dayts === 8979 && target === '600666.xshg') return false;
    else if (dayts === 9014 && target === '600697.xshg') return false;
    else if (dayts === 8740 && target === '600800.xshg') return false;
    else if (dayts === 8800 && target === '600822.xshg') return false;
    else if (dayts === 8680 && target === '600601.xshg') return false;
    else if (dayts === 8681 && target === '600601.xshg') return false;
    else if (dayts === 8163 && target === '600654.xshg') return false;
    else if (dayts === 9035 && target === '000526.xshe') return false;
    else if (dayts >= 8694 && dayts <= 8699 && target === '600601.xshg') return false;
    else return true;
}

function dateIgnore(target: string, dayts: number): boolean {
    target = target.toLowerCase();
    if (dayts === 9667 && target === '600812.xshg') return true;
    if (dayts === 8078 && target === '600654.xshg') return true;
    if (dayts < 8154 && target === '600605.xshg') return true;
    if (dayts < 8135 && target === '600606.xshg') return true;
    if (dayts < 8135 && target === '600608.xshg') return true;
    if (dayts < 8135 && target === '600604.xshg') return true;
    if (dayts < 8176 && target === '600653.xshg') return true;
    if ((dayts > 8222 && dayts < 8768) && target === '000005.xshe') return true;
    if ((dayts === 7942 || dayts === 7984 || dayts === 8068 || dayts === 8660 || dayts === 9374 || dayts === 9346 || dayts === 8072 || (dayts > 8419 && dayts < 8432) || (dayts > 9157 && dayts < 9174)) && target === '399001.zicn') return true;
    if (dayts < 13528 && target === '399905.zicn') return true;
    if (dayts < 12881 && target === '399300.zicn') return true;
    else return false;
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
                if (dateIgnore(target, dayts)) continue;
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
                const ltarget = target.toLowerCase();
                if (dayts === 8565 && ltarget === '600661.xshg')
                    tsdata.ex = 0.8974;
                if (dayts === 9615 && ltarget === '600660.xshg') {
                    tsdata.ex = 0.0195;
                    tsdata.v = 0.0975;
                }
                if (dayts === 8481 && ltarget === '000018.xshe') {
                    tsdata.ex = 0.0982;
                    tsdata.v = 0.2376;
                }
                if (dayts === 8182 && (ltarget === '600606.xshg' || ltarget === '600604.xshg' || ltarget === '600608.xshg')) {
                    tsdata.l = tsdata.e;
                }
                // if (dayts === 8981 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.5060;
                // if (dayts === 8982 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.3767;
                // if (dayts === 8985 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.3648;
                // if (dayts === 8987 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.3420;
                // if (dayts === 8988 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.3367;
                // if (dayts === 8995 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.2718;
                // if (dayts === 9008 && ltarget === '600647.xshg')
                //     tsdata.ex = 0.3287;
                // if (dayts === 16924 && pack.target === '300277.XSHE')
                //     tsdata.ex = 0.067;
                // else if (dayts === 16925 && pack.target === '300277.XSHE')
                //     tsdata.ex = 0.0567;
                // else if (dayts ===  16926 && pack.target === '300277.XSHE')
                //     tsdata.ex = 0.0655;
                const datekey = utility.date.dateTs2DateKey(dayts);
                if (!normalNum(tsdata.ex, true) || badExRate(tsdata.ex, dayts, target) || tsdata.nr > 1 || [tsdata.s, tsdata.e, tsdata.h, tsdata.l, tsdata.v, tsdata.mv, tsdata.nr].some(r => !normalNum(r, false)))
                    throw new Error(`bad value: ${target}, ${datekey}, ${JSON.stringify(tsdata)}`);
                if (prevdatekey != null) {
                    const prevData = vmap[prevdatekey];
                    if (prevData.s === tsdata.s && prevData.e === tsdata.e && prevData.h === tsdata.h && prevData.l === tsdata.l && utility.num.numDiffLessThan(prevData.v, tsdata.v, 0.001) && !exactlySameDataExceptions(datekey, target))
                        throw new Error(`${target}: exactly same data in ${prevdatekey} and ${datekey}`);
                }
                vmap[datekey] = tsdata;
                prevdts = dayts;
                prevdatekey = datekey;
            }
            const maxdayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[data.length - 1].tradeDate));
            const mindayts = utility.date.msTs2DateTs(utility.date.dashDateStrParse(data[0].tradeDate));
            if (maxdayts > endDayTs) throw new Error(`max date from WMCLOUD exceeds provided end date: ${utility.date.dateTs2DateKey(endDayTs)}, ${utility.date.dateTs2DateKey(maxdayts)}`);
            if (mindayts < startDayTs) throw new Error(`min date from WMCLOUD lower than provided start date: ${utility.date.dateTs2DateKey(startDayTs)}, ${utility.date.dateTs2DateKey(mindayts)}`);
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
                if (dateIgnore(target, dayts) || dayts === prevdts) continue;
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
                const datekey = utility.date.dateTs2DateKey(dayts);
                if ([tsdata.s, tsdata.e, tsdata.h, tsdata.l, tsdata.v].some(r => !normalNum(r, false)))
                    throw new Error(`${target}, ${datekey}: bad value: ${JSON.stringify(tsdata)}`);
                if (prevdatekey != null) {
                    const prevData = vmap[prevdatekey];
                    if (prevData.s === tsdata.s && prevData.e === tsdata.e && prevData.h === tsdata.h && prevData.l === tsdata.l)
                        throw new Error(`${target}: exactly same data in ${prevdatekey} and ${datekey}`);
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
                preEnd: data[0].preCloseIndex,
                count: data.length
            };
        });
}

function exactlySameDataExceptions(datekey: string, target: string): boolean {
    switch (target.toLowerCase()) {
        case '000803.xshe': {
            if (datekey === '20051110') return true;
            if (datekey === '20051123') return true;
            break;
        }
        case '601668.xshg': {
            if (datekey === '20111128') return true;
            break;
        }
        case '600651.xshg': {
            if (datekey === '19910116') return true;
            if (datekey === '19910117') return true;
            if (datekey === '19910122') return true;
            if (datekey === '19910204') return true;
            if (datekey === '19911213') return true;
            break;
        }
        case '600652.xshg': {
            if (datekey === '19910724') return true;
            if (datekey === '19910729') return true;
            break;
        }
        case '600603.xshg': {
            if (datekey === '19920318') return true;
            break;
        }
        case '600602.xshg': {
            if (datekey === '19920228') return true;
            break;
        }
        default: return false;
    }
    return false;
}
