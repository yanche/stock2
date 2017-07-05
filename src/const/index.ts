
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
    afterRawInspect: 'afterrawinspect',
    afterSimAll: 'aftersimall',
    lastEnd: 'lastend',
    lastEndAll: 'lastendall',
    alertsAll: 'alertsall',
    alert: 'alert',
    none: 'none'
}

export const simconcern = {
    viewtype: {
        dropfile: 'dropfile',
        raw: 'raw'
    }
};

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
        not: 'c.not',
        offset: 'c.offset',
        offsetv: 'c.offsetv',
        change: 'c.change'
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
        marketdays: 'x.marketdays'
    },
    ctx: {
        nhold: 'ctx.nhold',
        dropdown: 'ctx.dropdown',
        ndays: 'ctx.ndays',
        stoploss: 'ctx.stoploss'
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
