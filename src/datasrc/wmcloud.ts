
import * as bb from 'bluebird';
import * as utility from '../utility';
import * as config from '../config';
import * as datadef from '../datadef';

interface WMCloudApiRet {
    retCode: number;
    retMsg: string;
    data: Object;
}

/**
 * @param {string} url must starts with a '/'.
 */
export function get<To>(url: string): bb<Array<To>> {
    return bb.resolve()
        .then(() => {
            if (url[0] !== '/') throw new Error(`invalid url input: ${url}`);
            return utility.http.webreq({
                method: 'GET',
                host: 'api.wmcloud.com',
                port: 443,
                path: `/data/v1${url}`,
                headers: {
                    Authorization: `Bearer ${config.wmCloudToken}`
                }
            }, null, true)
                .then(reply => {
                    if (reply.statusCode !== 200) throw new Error(`bad status code from wmcloud: ${reply.statusCode}, ${url}`);
                    const j = <WMCloudApiRet>JSON.parse(reply.data.toString('utf8'));
                    if (j.retCode === -1) return [];
                    else if (j.retCode !== 1) throw new Error(`bad return msg: ${j.retCode}, ${j.retMsg}`);
                    else return <Array<To>>j.data;
                });
        });
}

function genFn<Ti extends WMAPIParams, To>(): (input: Ti) => bb<Array<To>> {
    return function (input: Ti): bb<Array<To>> {
        return get<To>(input.url());
    }
}

const market = {
    getMktEqud: genFn<GetMktEqudParams, GetMktEqudRet>(),
    getMktIdxd: genFn<GetMktIdxdParams, GetMktIdxdRet>(),
    //getStockFactorsDateRange: genFn('market', 'getStockFactorsDateRange'),
}
const equity = {
    getEquShare: genFn<GetEquShareParams, GetEquShareRet>(),
    getEqu: genFn<GetEquParams, GetEquRet>(),
    getEquIndustry: genFn<GetEquIndustryParams, GetEquIndustryRet>(),
};
const idx = {
    getIdx: genFn<GetIdxParams, GetIdxRet>(),
};
const master = {
    getSecID: genFn<GetSecIDParams, GetSecIDRet>(),
};

export { market, equity, idx, master }

function genWMAPIUrl(category: string, subcat: string, input: Array<{ name: string, val: Array<string> | string }>): string {
    const qry = new Array<string>();
    for (const x of input) {
        const v = x.val, n = x.name;
        if (Array.isArray(v)) {
            if (v.length > 0) qry.push(`${n}=${v.join(',')}`);
        }
        else {
            if (v != null) qry.push(`${n}=${v}`);
        }
    }
    return `/api/${category}/${subcat}.json${qry.length === 0 ? '' : ('?' + qry.join('&'))}`;
}

abstract class WMAPIParams {
    protected _url: string;
    url(): string { return this._url; }
}

// https://api.wmcloud.com/docs/pages/viewpage.action?pageId=2392198#id-指数信息-1
class GetIdxParams extends WMAPIParams {
    constructor(secID: string, ticker: string, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('idx', 'getIdx', [
            {
                name: 'secID',
                val: secID
            }, {
                name: 'ticker',
                val: ticker
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetIdxRet {
    secID?: string;
    publishDate?: string;
    secShortName?: string;
    ticker?: string;
    indexTypeCD?: string;
    indexType?: string;
    pubOrgCD?: string;
    porgFullName?: string;
    baseDate?: string;
    basePoint?: string;
    endDate?: string;
}

// https://api.wmcloud.com/docs/pages/viewpage.action?pageId=2392200#id-证券概况-3
class GetSecIDParams extends WMAPIParams {
    constructor(partyID: Array<string>, ticker: Array<string>, assetClass: string, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('master', 'getSecID', [
            {
                name: 'partyID',
                val: partyID
            }, {
                name: 'ticker',
                val: ticker
            }, {
                name: 'assetClass',
                val: assetClass
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetSecIDRet {
    secID?: string;
    ticker?: string;
    secShortName?: string;
    cnSpell?: string;
    exchangeCD?: string;
    assetClass?: string;
    listStatusCD?: string;
    listDate?: string;
    transCurrCD?: string;
    ISIN?: string;
    partyID?: string;
}

const dateformat = 'YYYYMMDD';
// https://api.wmcloud.com/docs/pages/viewpage.action?pageId=1867813#id-行情信息-getMktEqud
export class GetMktEqudParams extends WMAPIParams {
    constructor(secID: Array<string> | string, beginDate: Date, endDate: Date, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('market', 'getMktEqud', [
            {
                name: 'secID',
                val: secID
            }, {
                name: 'beginDate',
                val: utility.date.dateFormat(beginDate, dateformat, true)
            }, {
                name: 'endDate',
                val: utility.date.dateFormat(endDate, dateformat, true)
            }, {
                //     name: 'isOpen',
                //     val: isOpen ? '1' : '0'
                // }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetMktEqudRet {
    secID?: string;
    tradeDate: string;
    ticker?: string;
    secShortName?: string;
    exchangeCD?: string;
    preClosePrice?: number;
    actPreClosePrice?: number;
    openPrice?: number;
    highestPrice?: number;
    lowestPrice?: number;
    closePrice?: number;
    turnoverVol?: number;
    turnoverValue?: number;
    dealAmount?: number;
    turnoverRate?: number;
    accumAdjFactor?: number;
    negMarketValue?: number;
    marketValue?: number;
    isOpen?: number;
    PE?: number;
    PE1?: number;
    PB?: number;
}

export class GetMktIdxdParams extends WMAPIParams {
    constructor(indexID: Array<string> | string, beginDate: Date, endDate: Date, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('market', 'getMktIdxd', [
            {
                name: 'indexID',
                val: indexID
            }, {
                name: 'beginDate',
                val: utility.date.dateFormat(beginDate, dateformat, true)
            }, {
                name: 'endDate',
                val: utility.date.dateFormat(endDate, dateformat, true)
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetMktIdxdRet {
    indexID?: string;
    tradeDate?: string;
    ticker?: string;
    porgFullName?: string;
    secShortName?: string;
    exchangeCD?: string;
    preCloseIndex?: number;
    openIndex?: number;
    lowestIndex?: number;
    highestIndex?: number;
    closeIndex?: number;
    turnoverVol?: number;
    turnoverValue?: number;
    CHG?: number;
    CHGPct?: number;
}

class GetEquShareParams extends WMAPIParams {
    constructor(secID: Array<string>, ticker: Array<string>, beginDate: Date, endDate: Date, partyID: string, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('market', 'getEquShare', [
            {
                name: 'secID',
                val: secID
            }, {
                name: 'ticker',
                val: ticker
            }, {
                name: 'partyID',
                val: partyID
            }, {
                name: 'beginDate',
                val: utility.date.dateFormat(beginDate, dateformat, true)
            }, {
                name: 'endDate',
                val: utility.date.dateFormat(endDate, dateformat, true)
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetEquShareRet {
    changeDate?: string;
    secID?: string;
    exchangeCD?: string;
    ticker?: string;
    secShortName?: string;
    partyID?: number;
    totalShares?: number;
    sharesA?: number;
    sharesB?: number;
    floatA?: number;
    nonrestfloatA?: number;
    floatB?: number;
    restShares?: number;
    nonrestFloatShares?: number;
}

class GetEquParams extends WMAPIParams {
    constructor(secID: Array<string>, ticker: Array<string>, equTypeCD: string, listStatusCD: Array<string>, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('market', 'getEqu', [
            {
                name: 'secID',
                val: secID
            }, {
                name: 'ticker',
                val: ticker
            }, {
                name: 'equTypeCD',
                val: equTypeCD
            }, {
                name: 'listStatusCD',
                val: listStatusCD
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetEquRet {
    secID?: string;
    ticker?: string;
    exchangeCD?: string;
    ListSectorCD?: number;
    ListSector?: string;
    transCurrCD?: string;
    secShortName?: string;
    secFullName?: string;
    listStatusCD?: string;
    listDate?: string;
    delistDate?: string;
    equTypeCD?: string;
    equType?: string;
    exCountryCD?: string;
    partyID?: number;
    totalShares?: number;
    nonrestFloatShares?: number;
    nonrestfloatA?: number;
    officeAddr?: string;
    primeOperating?: string;
    endDate?: string;
    TShEquity?: number;
}

class GetEquIndustryParams extends WMAPIParams {
    constructor(secID: Array<string>, ticker: Array<string>, intoDate: Date, industry: string, industryVersionCD: string, field: Array<string>) {
        super();
        this._url = genWMAPIUrl('market', 'getEquIndustry', [
            {
                name: 'secID',
                val: secID
            }, {
                name: 'ticker',
                val: ticker
            }, {
                name: 'intoDate',
                val: utility.date.dateFormat(intoDate, dateformat, true)
            }, {
                name: 'industry',
                val: industry
            }, {
                name: 'industryVersionCD',
                val: industryVersionCD
            }, {
                name: 'field',
                val: field
            }
        ]);
    }
}

interface GetEquIndustryRet {
    secID?: string;
    industry?: string;
    industryID1?: string;
    industryID2?: number;
    industryID3?: string;
    industryID4?: string;
    ticker?: string;
    exchangeCD?: string;
    secShortName?: string;
    secFullName?: string;
    partyID?: number;
    industryVersionCD?: string;
    industryID?: string;
    industrySymbol?: string;
    intoDate?: string;
    outDate?: string;
    isNew?: number;
    industryName1?: string;
    industryName2?: string;
    industryName3?: string;
    industryName4?: string;
}

export function getAllStocks(): bb<Array<datadef.TargetInfo>> {
    return master.getSecID(new GetSecIDParams(null, null, 'E', ['listStatusCD', 'secShortName', 'secID', 'listDate', 'exchangeCD']))
        .then(secs => secs.filter(s => s.listStatusCD === 'L' && (s.exchangeCD === 'XSHG' || s.exchangeCD === 'XSHE') && s.secID.slice(0, 2) !== '36' && (['0', '3', '6'].some(x => x === s.secID[0]))))
        .then(secs => secs.map(s => {
            return {
                name: s.secShortName,
                target: s.secID,
                listDayTs: utility.date.msTs2DateTs(utility.date.dashDateStrParse(s.listDate))
            };
        }));
};

export function getAllIndexes(): bb<Array<datadef.TargetInfo>> {
    return idx.getIdx(new GetIdxParams(null, null, ['secID', 'indexType', 'secShortName', 'baseDate']))
        .then(secs => secs.filter(s => s.secID.indexOf('ZICN') > 0 && s.indexType === '股票指数'))
        .then(secs => secs.map(s => {
            return {
                name: s.secShortName,
                target: s.secID,
                listDayTs: utility.date.msTs2DateTs(utility.date.dashDateStrParse(s.baseDate))
            };
        }));
};
