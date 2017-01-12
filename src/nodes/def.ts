
import * as mongo from 'mongodb';
import * as dp from '../datapvd';

export interface Task {
    _id?: mongo.ObjectID | string;
    locality?: Object;
    condition?: { type: string, pack?: any };
    action?: { type: string, pack?: any };
    postAction?: Object;
    constraints?: { ttl?: number, conditionCheckInterval?: number, timeoutLevel?: number };
    comments?: string;
    statusId?: number;
    createdTs?: number;
    processLog?: Array<{ msg: string; ts: number; err?: string }>;
    lastProcessTs?: number;
    nextConditionCheckTs?: number;
    lastConditionCheckTs?: number;
    quickview?: Object;
    priority?: number;
    assigned?: number;
}

export interface Simulate {
    _id?: mongo.ObjectID | string;
    closed?: boolean;
    target?: string;
    sdts?: number;
    sp?: number;
    edts?: number;
    ep?: number;
    hdts?: number;
    hp?: number;
    ldts?: number;
    lp?: number;
    glong?: boolean;
    rtplanId?: string;
    env?: Array<{ target: string, sp: number, ep: number }>;
    concernsIn?: Array<Object>;
    concernsOut?: Array<Object>;
}

export interface SimTrack {
    _id?: mongo.ObjectID | string;
    target?: string;
    rtplanId?: string;
    lastSimDateTs?: number;
}

export interface SysTrack {
    _id?: string;
    pack?: any;
}

export interface Rtprog {
    _id?: mongo.ObjectID | string;
    rtplanId?: string;
    target?: string;
    rtprog?: Object;
    glong?: boolean;
    createdTs?: number;
    hit?: boolean;
    hitUpdateTs?: number;
}

export interface RtprogOut {
    _id?: mongo.ObjectID | string;
    rtplanId?: string;
    target?: string;
    rtprog?: Object;
    glong?: boolean;
    createdTs?: number;
    sdts?: number;
    sp?: number;
    hdts?: number;
    hp?: number;
    ldts?: number;
    lp?: number;
    hit?: boolean;
    hitUpdateTs?: number;
}

export interface Rtplan {
    _id?: string;
    targetScope?: { type?: string, pack?: any },
    cpdefRef?: dp.literal.LiteralDP,
    cpoutdefRef?: dp.literal.LiteralDP,
    createdTs?: number,
    comments?: Object, //structured
    name?: string,
    doc?: Object,
    lookback?: Object, //回测数据
    glong?: boolean,
    startDateTs?: number,
    runrt?: boolean, //是否跑实时数据提醒（目前仅龙虎榜不跑）
    concerns?: { in?: Array<RtplanConcern>, out?: Array<RtplanConcern> },
}

export interface RtplanConcern {
    name: string;
    view: string;
    dpRef: dp.literal.LiteralDP;
}

export interface Rtprice {
    _id?: string,
    lastEnd?: number,
    lastTs?: number,
    lastEndUpdateTs?: number,
    adjprices?: {
        p?: number,
        s?: number,
        e?: number,
        l?: number,
        h?: number,
        v?: number,
        ex?: number,
        nr?: number,
        mv?: number
    },
    prices?: {
        p?: number,
        s?: number,
        e?: number,
        l?: number,
        h?: number,
        v?: number,
        ex?: number,
        nr?: number,
        mv?: number
    },
    priceUpdateTs?: number,
};
