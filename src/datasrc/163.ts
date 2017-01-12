
import * as bb from 'bluebird';
import * as utility from '../utility';
import * as _ from 'lodash';
import * as datadef from '../datadef';
import * as log from '../log';

export function getRTAll(count: number) {
    const reqcount = Math.ceil(count / 1000);
    const indexarr = new Array(reqcount);
    for (let i = 0; i < reqcount; ++i) indexarr[i] = i;
    return bb.all(indexarr.map(idx => stockReq(idx, 1000)))
        .then(data => {
            const all = _.flatten(data);
            log.info(`${all.length} rt data was loaded from 163 api`);
            const ret = new Map<string, StockRTData>();
            let ct = 0, tradingcount = 0;
            for (let item of all) {
                const target = toWMTarget(item.CODE);
                if (!ret.has(target)) {
                    ct++;
                    const conv = toStockData(item);
                    if (conv) {
                        ret.set(target, conv);
                        tradingcount++;
                    }
                    else
                        ret.set(target, null);
                }
            }
            log.info(`distinguished stock count: ${count}`);
            log.info(`trading stock count: ${tradingcount}`);

            const ret2 = new Map<string, datadef.RawDataSlice>();
            return indexReq()
                .then(data => {
                    for (let t in data) {
                        const target = toWMTarget(t);
                        ret2.set(target, toIdxData(data[t]));
                    }
                })
                .then(() => {
                    return { stocks: ret, indexes: ret2 };
                });
        });
}

const wyFields = ['CODE', 'HIGH', 'LOW', 'OPEN', 'PRICE', 'YESTCLOSE', 'TURNOVER', 'HS', 'MCAP', 'TCAP'];

function stockReq(page: number, count: number): bb<Array<StockWYData>> {
    return utility.http.webreq({
        host: 'quotes.money.163.com',
        path: '/hs/service/diyrank.php?' + [
            'page=' + page,
            'query=STYPE:EQA',
            'fields=' + wyFields.join(','),
            'count=' + count,
            'type=query',
            'sort=SYMBOL',
            'order=asc'
        ].join('&')
    })
        .then(reply => {
            if (reply.statusCode !== 200) throw new Error(`bad status code: ${reply.statusCode}`);
            const j = utility.parseJson<{ list: Array<StockWYData> }>(reply.data.toString('utf8'));
            if (j) return j.list;
            else throw new Error(`failed to parse returned value by 163 finance`);
        })
}

function indexReq(): bb<{ [key: string]: IndexWYData }> {
    return utility.http.webreq({
        host: 'api.money.126.net',
        path: '/data/feed/0000001,1399001,1399006,1399300,0000016?callback=a'
    })
        .then(reply => {
            if (reply.statusCode != 200) throw new Error(`bad status code: ${reply.statusCode}`);
            const str = reply.data.toString('utf8');
            const j = utility.parseJson<{ [key: string]: IndexWYData }>(str.slice(2, -2));
            if (j == null) throw new Error('failed to parse returned index value by 163 finance');
            return j;
        });
};

function toWMTarget(code: string) {
    if (code.length === 7) {
        if (code === '0000001' || code === '1399001' || code === '1399006' || code === '1399300' || code === '0000016')
            return code.slice(1) + '.ZICN';
        code = code.slice(1);
        if (code[0] === '0' || code[0] === '3') return code + '.XSHE';
        else if (code[0] === '6') return code + '.XSHG';
        else throw new Error(`unknown code: ${code}`);
    }
}

function toStockData(wydata: StockWYData): StockRTData {
    const ret: { [key: string]: number } = {
        p: wydata.YESTCLOSE,
        s: wydata.OPEN,
        e: wydata.PRICE,
        h: wydata.HIGH,
        l: wydata.LOW,
        mv: utility.num.frac(wydata.TCAP / 100000000, 2),
        nr: utility.num.frac(wydata.MCAP / wydata.TCAP, 3),
        v: utility.num.frac(wydata.TURNOVER / 100000000, 4),
        ex: wydata.HS
    };
    if (ret['v'] !== 0) {
        for (let i in ret) {
            if (!normalNum(ret[i]))
                throw new Error(`${wydata.CODE} has bad data: ${i}, ${ret[i]}`);
        }
        return <any>ret;
    }
    else return null;
};

function toIdxData(wydata: IndexWYData): datadef.RawDataSlice {
    const ret: { [key: string]: number } = {
        s: wydata.open,
        e: wydata.price,
        h: wydata.high,
        l: wydata.low,
        v: utility.num.frac(wydata.turnover / 100000000, 2)
    };
    for (let i in ret) {
        if (!normalNum(ret[i], i === 'v'))
            throw new Error(`${wydata.code} has bad data: ${i}, ${ret[i]}`);
    }
    return <any>ret;
};

function normalNum(num: number, allowzero?: boolean) {
    return utility.validate.isNum(num) && !isNaN(num) && isFinite(num) && (allowzero ? (num >= 0) : (num > 0));
};

interface StockWYData {
    CODE: string;
    YESTCLOSE: number;
    OPEN: number;
    PRICE: number;
    HIGH: number;
    LOW: number;
    TCAP: number;
    MCAP: number;
    TURNOVER: number;
    HS: number;
}

interface IndexWYData {
    code: string;
    open: number;
    price: number;
    high: number;
    low: number;
    turnover: number;
}

export interface StockRTData extends datadef.RawDataSlice {
    p: number;
}
