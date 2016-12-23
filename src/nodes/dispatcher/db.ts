
import * as utility from '../../utility';
import * as config from '../../config';
import * as d from '../def';

const dbc = new utility.mongo.DbClient(config.dispatcherMongoUrl);

const taskFields = {
    _id: 1,
    locality: 1,
    condition: 1,
    action: 1,
    postAction: 1,
    constraints: 1, //timeout level(timeoutLevel), pre condition check interval(conditionCheckInterval), time to live(retry quota left, ttl)
    comments: 1,
    statusId: 1,
    createdTs: 1,
    processLog: 1,
    lastProcessTs: 1,
    nextConditionCheckTs: 1,
    lastConditionCheckTs: 1,
    quickview: 1,
    priority: 1,
    assigned: 1, //count of assignment
}

const simulateFields = {
    _id: 1,
    target: 1,
    closed: 1,
    sts: 1,
    sp: 1,
    ets: 1,
    ep: 1,
    hts: 1,
    hp: 1,
    lts: 1,
    lp: 1,
    glong: 1,
    rtplanId: 1,
    createdTs: 1,
    updateTs: 1,
    env: 1, //map of { sp:, ep: }, key is target
    concernsIn: 1,
    concernsOut: 1
};

const simtrackFields = {
    _id: 1,
    target: 1,
    rtplanId: 1,
    lastSimTs: 1,
};

const rtplanFields = {
    _id: 1,
    targetScope: 1,
    cpdefRef: 1,
    cpoutdefRef: 1,
    createdTs: 1,
    comments: 1, //structured
    name: 1,
    doc: 1,
    lookback: 1, //回测数据
    glong: 1,
    startTs: 1,
    runrt: 1, //是否跑实时数据提醒（目前仅龙虎榜不跑）
    concerns: 1,
};

const rtprogFields = {
    _id: 1,
    target: 1,
    rtprog: 1,
    rtplanId: 1,
    glong: 1,
    hit: 1,
    hitUpdateTs: 1,
};

const rtprogOutFields = {
    _id: 1,
    target: 1,
    sts: 1,
    sp: 1,
    hts: 1,
    hp: 1,
    lts: 1,
    lp: 1,
    rtprog: 1,
    rtplanId: 1,
    glong: 1,
    hit: 1,
    hitUpdateTs: 1,
};

const rtpriceFields = {
    _id: 1, //_id here is target, serve as primary key
    lastEnd: 1,
    lastTs: 1,
    lastEndUpdateTs: 1,
    adjprices: 1,
    prices: 1,
    priceUpdateTs: 1,
};

const systrackFields = {
    _id: 1,
    pack: 1,
};

const task = dbc.getCollClient<d.Task>(config.dbCols.task, taskFields);
const simulate = dbc.getCollClient<d.Simulate>(config.dbCols.simulate, simulateFields);
const simtrack = dbc.getCollClient<d.SimTrack>(config.dbCols.simtrack, simtrackFields);
const rtplan = dbc.getCollClient<d.Rtplan>(config.dbCols.rtplan, rtplanFields);
const rtprog = dbc.getCollClient<d.Rtprog>(config.dbCols.rtprog, rtprogFields);
const rtprogout = dbc.getCollClient<d.RtprogOut>(config.dbCols.rtprogout, rtprogOutFields);
const rtprice = dbc.getCollClient<d.Rtprice>(config.dbCols.rtprice, rtpriceFields);
const systrack = dbc.getCollClient<d.SysTrack>(config.dbCols.systrack, systrackFields);

export {task, simulate, simtrack, rtplan, rtprog, rtprogout, rtprice, systrack};
