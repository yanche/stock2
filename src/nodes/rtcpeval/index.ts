
import * as utility from '../../utility';
import * as bb from 'bluebird';
import * as dclient from '../dclient';
import * as def from '../def';
import * as datadef from '../../datadef';
import * as log from '../../log';
import * as datasrc from '../../datasrc';
import * as constants from '../../const';

export function init() {
    schedule({ lastRTProgLoadTs: null, rtprogs: null, rtprogouts: null, lastEndMap: null, stockCount: 0 });
};

const tradeTsInDay = 1000 * 60 * 60 * 4;
const noonRestTs = 1000 * 60 * 60 * 1.5;

interface TimeBounds {
    weekend: boolean,
    b0: number,
    b1: number,
    b2: number,
    b25: number,
    b3: number,
    b4: number,
    b5: number,
    b6: number,
    bprog: number,
    dts: number
}

function curDate() {
    //2016-1-16 早上10点
    return new Date(Date.UTC(2017 ,0,16,2,0,0,0));
    //return new Date();
}

function getTimeBounds(): TimeBounds {
    const b0 = curDate();
    //China time 9:00
    b0.setUTCHours(1, 0, 0, 0);
    const b1 = curDate();
    //China time 9:20
    b1.setUTCHours(1, 20, 0, 0);
    const b2 = curDate();
    //China time 9:30
    b2.setUTCHours(1, 30, 0, 0);
    const b25 = curDate();
    //China time 11:30
    b25.setUTCHours(3, 30, 0, 0);
    const b3 = curDate();
    //China time 11:40
    b3.setUTCHours(3, 40, 0, 0);
    const b4 = curDate();
    //China time 13:00
    b4.setUTCHours(5, 0, 0, 0);
    const b5 = curDate();
    //China time 15:00
    b5.setUTCHours(7, 0, 0, 0);
    const b6 = curDate();
    //China time 15:10
    b6.setUTCHours(7, 10, 0, 0);
    //早于此时间（昨天下午4点）生成的rtprog一概不执行
    let bprog = curDate();
    bprog.setUTCHours(8, 0, 0, 0);
    bprog = utility.date.dateOffset(bprog, { day: -1 });
    return {
        weekend: (b0.getDay() % 6) == 0,
        b0: b0.getTime(),
        b1: b1.getTime(),
        b2: b2.getTime(),
        b25: b25.getTime(),
        b3: b3.getTime(),
        b4: b4.getTime(),
        b5: b5.getTime(),
        b6: b6.getTime(),
        bprog: bprog.getTime(),
        dts: utility.date.nowUTCTs()
    };
}

function schedule(pack: Pack) {
    bb.resolve()
        .then(() => {
            const nowTs = curDate().getTime(), b = getTimeBounds();
            if (b.weekend || nowTs < b.b1 || nowTs > b.b6 || (nowTs > b.b3 && nowTs < b.b4)) log.info('not the time, do nothing');
            else if (pack.lastRTProgLoadTs == null || pack.lastRTProgLoadTs < b.b1) {
                //load exec nodes from server
                log.info('now loading stock real-time dp prog from server');
                pack.lastRTProgLoadTs = curDate().getTime();
                return bb.all([
                    dclient.rtprog.getAll({}),
                    dclient.rtprogout.getAll({}),
                    dclient.rtprice.getAll({}, { _id: 1, lastEnd: 1, lastEndUpdateTs: 1 }),
                    datasrc.mine.meta.stock.getNames()
                ])
                    .then(data => {
                        pack.rtprogs = data[0];
                        pack.rtprogouts = data[1];
                        const lastEnds = data[2];
                        log.info(`${pack.rtprogs.length} stock real-time dp prog loaded from server`);
                        log.info(`${pack.rtprogouts.length} stock real-time dp prog-out loaded from server`);
                        log.info(`${lastEnds.length} last-end data loaded from server`);
                        const lastEndMap = new Map<string, number>();
                        for (let le of lastEnds) {
                            if (le.lastEndUpdateTs < b.bprog)
                                console.warn(`${le._id}\'s last end data is updated in ${utility.date.datetimeFormat(le.lastEndUpdateTs)}`);
                            lastEndMap.set(le._id, le.lastEnd);
                        }
                        pack.lastEndMap = lastEndMap;
                        pack.stockCount = data[3].length;
                    });
            }
            else {
                log.info('now working');
                return work(pack.rtprogs, pack.rtprogouts, pack.lastEndMap, pack.stockCount);
            }
        })
        .catch((err: any) => {
            log.error(err);
        })
        .then(() => {
            schedule(pack);
        });
}

function work(rtprogs: Array<def.Rtprog>, rtprogouts: Array<def.RtprogOut>, lastEndMap: Map<string, number>, stockcount: number) {
    return bb.resolve()
        .then(() => datasrc.rt163.getRTAll(stockcount))
        .then(prices => {
            const b = getTimeBounds();
            const adjprices = new Map<string, datadef.RawDataSlice>(), rtpricepost = new Array<{ filter: Object, update: Object }>();
            for (let item of prices.stocks) {
                const data = item[1], target = item[0];
                if (data) {
                    if (lastEndMap.has(target)) {
                        const adjp = genPrices(data, b, lastEndMap.get(target));
                        adjprices.set(target, adjp);
                        rtpricepost.push({ filter: { _id: target }, update: { $set: { adjprices: adjp, prices: data, priceUpdateTs: curDate().getTime() } } });
                    }
                    else
                        log.warn(`${target} not found in lastEndMap`);
                }
            }
            for (let item of prices.indexes) {
                const data = item[1], target = item[0];
                var adjp = genIndex(data, b);
                adjprices.set(target, adjp);
                rtpricepost.push({ filter: { _id: target }, update: { $set: { adjprices: adjp, prices: data, priceUpdateTs: curDate().getTime() } } });
            }
            log.info(`posting ${rtpricepost.length} rt-price data to server`);
            return dclient.rtprice.bulkUpsert(rtpricepost)
                .then(() => {
                    const env = new utility.prog.Env();
                    env.setMul(adjprices);
                    env.set(constants.rtProgRef.curDts, b.dts);
                    //new simulate hit
                    const rtprogsHitChange = new Array<def.Rtprog>();
                    const rtprogoutsHitChange = new Array<def.RtprogOut>();
                    for (let rtprog of rtprogs) {
                        if (!adjprices.has(rtprog.target)) //休盘, 或上市首日
                            continue;

                        const hit = utility.prog.evaluate(rtprog.rtprog, env);
                        if (rtprog.hit !== hit) {
                            rtprog.hit = hit;
                            rtprog.hitUpdateTs = curDate().getTime();
                            rtprogsHitChange.push(rtprog);
                        }
                    }
                    //old simulate close
                    for (let rtprogout of rtprogouts) {
                        const adjprice = adjprices.get(rtprogout.target);
                        if (!adjprice) //休盘, 或上市首日
                            continue;

                        const ctx = {
                            sdts: rtprogout.sdts,
                            sp: rtprogout.sp,
                            hdts: b.dts,
                            hp: adjprice.h,
                            ldts: b.dts,
                            lp: adjprice.l,
                        };
                        if (rtprogout.hdts) {
                            if (rtprogout.hp > ctx.hp) {
                                ctx.hdts = rtprogout.hdts;
                                ctx.hp = rtprogout.hp;
                            }
                            if (rtprogout.lp < ctx.lp) {
                                ctx.ldts = rtprogout.ldts;
                                ctx.lp = rtprogout.lp;
                            }
                        }
                        const envctx = new utility.prog.Env(env);
                        envctx.set(constants.rtProgRef.ctx, ctx);
                        const hit = utility.prog.evaluate(rtprogout.rtprog, envctx);
                        if (rtprogout.hit !== hit) {
                            rtprogout.hit = hit;
                            rtprogout.hitUpdateTs = curDate().getTime();
                            rtprogoutsHitChange.push(rtprogout);
                        }
                    }

                    let prmRtProgChange = bb.resolve();
                    if (rtprogsHitChange.length > 0) {
                        log.info(`reporting ${rtprogsHitChange.length} hit change for rtprog`);
                        prmRtProgChange = dclient.rtprog.bulkUpdate(rtprogsHitChange.map(rtprog => {
                            return {
                                filter: { _id: rtprog._id },
                                update: { $set: { hit: rtprog.hit, hitUpdateTs: rtprog.hitUpdateTs } }
                            };
                        }))
                            .then(() => null);
                    }
                    else
                        log.info('no hit change for rtprog');

                    let prmRtProgOutChange = bb.resolve();
                    if (rtprogoutsHitChange.length > 0) {
                        log.info(`reporting ${rtprogoutsHitChange.length} hit change for rtprogout`);
                        prmRtProgOutChange = dclient.rtprogout.bulkUpdate(rtprogoutsHitChange.map(rtprogout => {
                            return {
                                filter: { _id: rtprogout._id },
                                update: { $set: { hit: rtprogout.hit, hitUpdateTs: rtprogout.hitUpdateTs } }
                            };
                        }))
                            .then(() => null);
                    }
                    else
                        log.info('no hit change for rtprogout');

                    return bb.all([prmRtProgChange, prmRtProgOutChange]);
                });
        })
        .then(() => null);
};

function genPrices(rt: datasrc.rt163.StockRTData, b: TimeBounds, lastEnd: number): datadef.RawDataSlice {
    const dts = curDate().getTime(), pRatio = lastEnd / rt.p;
    let volratio = 0;
    if (dts < b.b2)
        volratio = 0;
    else if (dts < b.b25)
        volratio = tradeTsInDay / (dts - b.b2);
    else if (dts < b.b4)
        volratio = 2;
    else if (dts < b.b5)
        volratio = tradeTsInDay / (dts - b.b2 - noonRestTs);
    else
        volratio = 1;
    return {
        s: utility.num.frac(rt.s * pRatio, 3),
        e: utility.num.frac(rt.e * pRatio, 3),
        h: utility.num.frac(rt.h * pRatio, 3),
        l: utility.num.frac(rt.l * pRatio, 3),
        ex: utility.num.frac(Math.min(rt.ex * volratio, 1), 4),
        v: utility.num.frac(rt.v * volratio, 3),
        mv: utility.num.frac(rt.mv, 0),
        nr: utility.num.frac(rt.nr, 2)
    };
};

function genIndex(rt: datadef.RawDataSlice, b: TimeBounds): datadef.RawDataSlice {
    const dts = curDate().getTime();
    let volratio = 0;
    if (dts < b.b2)
        volratio = 0;
    else if (dts < b.b25)
        volratio = tradeTsInDay / (dts - b.b2);
    else if (dts < b.b4)
        volratio = 2;
    else if (dts < b.b5)
        volratio = tradeTsInDay / (dts - b.b2 - noonRestTs);
    else
        volratio = 1;
    return {
        s: utility.num.frac(rt.s, 2),
        e: utility.num.frac(rt.e, 2),
        h: utility.num.frac(rt.h, 2),
        l: utility.num.frac(rt.l, 2),
        v: utility.num.frac(rt.v * volratio, 2),
    };
};

interface Pack {
    lastRTProgLoadTs: number;
    rtprogs: Array<def.Rtprog>;
    rtprogouts: Array<def.RtprogOut>;
    lastEndMap: Map<string, number>;
    stockCount: number;
}
