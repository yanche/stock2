
export const task = {
    status: {
        new: 1,
        conditionCheckInterval: 2,
        prepared: 3,
        processing: 4,
        success: 5,
        failed: 6,
        timeout: 7,
        closed: 8,
        abandoned: 9
    },
    constraints: {
        timeoutLevel: {
            short: {
                code: 1,
                ms: 1000 * 60 //1 min
            },
            medium: {
                code: 2,
                ms: 1000 * 60 * 5 //5 min
            },
            long: {
                code: 3,
                ms: 1000 * 60 * 30 //30 min
            },
            exlong: {
                code: 4,
                ms: 1000 * 60 * 60 * 4 //4 hour
            }
        },
        conditionCheckInterval: {
            short: {
                code: 1,
                ms: 1000 * 5 //5 sec
            },
            medium: {
                code: 2,
                ms: 1000 * 30 //30 sec
            },
            long: {
                code: 3,
                ms: 1000 * 60 * 5 //5 min
            },
            exlong: {
                code: 4,
                ms: 1000 * 60 * 60 //1 hour
            }
        }
    }
};

export const action = {
    rawInspect: 'rawinspect',
    rawSync: 'rawsync',
    rawData: 'rawdata',
    stockList: 'stocklist',
    simulate: 'simulate',
    simAll: 'simall',
    hypoTest: 'hypotest',
    hypoTestAggr: 'hypotestaggr',
    genRtProg: 'genrtprog',
    genRtProgAll: 'genrtprogall',
    delay: 'delay',
    afterRawInspect: 'afterrawinspect'
}

export const simconcern = {
    viewtype: {
        dropfile: 'dropfile',
        raw: 'raw'
    }
};

export const dispatcherCond = {
    ok: 'ok',
    success: 'success',
    complete: 'complete',
    timer: 'timer',
    and: 'and',
    or: 'or'
}

export const dpType = {
    raw: {
        end: 'r.end',
        start: 'r.start',
        high: 'r.high',
        low: 'r.low',
        ex: 'r.ex',
        vol: 'r.vol',
        marketValue: 'r.marketvalue',
        netRate: 'r.netrate',
        grow: 'r.grow',
        growRate: 'r.growrate',
        const: 'r.const',
        amp: 'r.amp'
    },
    combine: {
        prop: 'c.prop',
        add: 'c.add',
        sub: 'c.sub',
        div: 'c.div',
        mul: 'c.mul',
        max: 'c.max',
        min: 'c.min',
        abs: 'c.abs',
        pow: 'c.pow',
        and: 'c.and',
        or: 'c.or',
        eq: 'c.eq',
        gt: 'c.gt',
        gte: 'c.gte',
        lt: 'c.lt',
        lte: 'c.lte',
        between: 'c.between',
        not: 'c.not'
    },
    basic: {
        ma: 'b.ma',
        boll: 'b.boll',
        macd: 'b.macd',
        kdj: 'b.kdj',
        rsi: 'b.rsi',
        ema: 'b.ema'
    },
    util: {
        marketDay: 'u.mktdays'
    },
    ext: {
        break: 'x.break',
        localpeak: 'x.localpeak',
        deviate: 'x.deviate',
    }
}

export const rtProgRef = {
    ctx: 'ctx',
    curDts: 'cur_dts',
    //target: 'target',
}

export const rtProgCtxProps = {
    sdts: 'sdts',
    hdts: 'hdts',
    ldts: 'ldts',
    sp: 'sp',
    hp: 'hp',
    lp: 'lp'
}
