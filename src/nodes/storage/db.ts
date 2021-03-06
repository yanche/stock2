
import * as utility from '../../utility';
import * as config from '../../config';
import * as d from '../def';

const dbc = new utility.mongo.DbClient(config.storageMongoUrl);

const simulateFields = {
    _id: 1,
    target: 1,
    closed: 1,
    sdts: 1,
    sp: 1,
    edts: 1,
    ep: 1,
    hdts: 1,
    hp: 1,
    ldts: 1,
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
    lastSimDateTs: 1,
};

const rtplanFields = {
    _id: 1,
    targetScope: 1,
    envMap: 1,
    cpdefRef: 1,
    cpoutdefRef: 1,
    createdTs: 1,
    comments: 1, //structured
    name: 1,
    doc: 1,
    lookback: 1, //回测数据
    glong: 1,
    startDateTs: 1,
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
    sdts: 1,
    sp: 1,
    hdts: 1,
    hp: 1,
    ldts: 1,
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
    lastDts: 1,
    lastEndUpdateTs: 1,
    adjprices: 1,
    prices: 1,
    priceUpdateTs: 1,
};

const alertplanFields = {
    _id: 1,
    name: 1,
    desc: 1,
    rtplanId: 1,
    prog: 1
};

const alertFields = {
    _id: 1,
    simulateId: 1,
    target: 1,
    alertPlanId: 1,
    createdTs: 1,
    new: 1
}

const simulate = dbc.getCollClient<d.Simulate>(config.dbCols.simulate, simulateFields);
const simtrack = dbc.getCollClient<d.SimTrack>(config.dbCols.simtrack, simtrackFields);
const rtplan = dbc.getCollClient<d.Rtplan>(config.dbCols.rtplan, rtplanFields);
const rtprog = dbc.getCollClient<d.Rtprog>(config.dbCols.rtprog, rtprogFields);
const rtprogout = dbc.getCollClient<d.RtprogOut>(config.dbCols.rtprogout, rtprogOutFields);
const rtprice = dbc.getCollClient<d.Rtprice>(config.dbCols.rtprice, rtpriceFields);
const alertplan = dbc.getCollClient<d.AlertPlan>(config.dbCols.alertplan, alertplanFields);
const alert = dbc.getCollClient<d.Alert>(config.dbCols.alert, alertFields);

export { simulate, simtrack, rtplan, rtprog, rtprogout, rtprice, alertplan, alert };
