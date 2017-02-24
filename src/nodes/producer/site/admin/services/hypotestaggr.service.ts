
import { Injectable } from '@angular/core';

@Injectable()
export class HypoTestAggrService {
    popularDataSet: PreparedDataSet = popularDataSet;
}

const popularDataSet: PreparedDataSet = {
    envMap: '{}',
    enums: [
        { name: 'N', values: '30;60;120' },
        { name: 'waitN', values: '100;150' }
    ],
    cpdefRef: JSON.stringify({
        type: 'b.boll',
        pack: {
            N: "{{N}}",
            dp: {
                type: 'r.end',
                pack: "{{target}}"
            }
        }
    }),
    cpoutDefRefs: [
        {
            name: 'nhold1',
            dpref: JSON.stringify({ pack: { target: '{{target}}', N: '{{waitN}}' }, type: 'ctx.nhold' })
        }
    ],
    envRefs: [
        marel('000001.ZICN', 10, 'sh-marel-10'),
        marel('000001.ZICN', 30, 'sh-marel-30'),
        marel('000001.ZICN', 60, 'sh-marel-60'),
        marel('000001.ZICN', 120, 'sh-marel-120'),
        marel('000001.ZICN', 250, 'sh-marel-250'),
        marel('000001.ZICN', 500, 'sh-marel-500'),
        marel('000001.ZICN', 1000, 'sh-marel-1000'),
        marel('399001.ZICN', 10, 'sz-marel-10'),
        marel('399001.ZICN', 30, 'sz-marel-30'),
        marel('399001.ZICN', 60, 'sz-marel-60'),
        marel('399001.ZICN', 120, 'sz-marel-120'),
        marel('399001.ZICN', 250, 'sz-marel-250'),
        marel('399001.ZICN', 500, 'sz-marel-500'),
        marel('399001.ZICN', 1000, 'sz-marel-1000'),
        marel('399006.ZICN', 10, 'cyb-marel-10'),
        marel('399006.ZICN', 30, 'cyb-marel-30'),
        marel('399006.ZICN', 60, 'cyb-marel-60'),
        marel('399006.ZICN', 120, 'cyb-marel-120'),
        marel('{{target}}', 10, 'target-marel-10'),
        marel('{{target}}', 30, 'target-marel-30'),
        marel('{{target}}', 60, 'target-marel-60'),
        marel('{{target}}', 120, 'target-marel-120'),
        volrel('000001.ZICN', 5, 10, 'sh-volrel-5-10'),
        volrel('399001.ZICN', 5, 10, 'sz-volrel-5-10'),
        volrel('399006.ZICN', 5, 10, 'cyb-volrel-5-10'),
        volrel('{{target}}', 5, 10, 'target-volrel-5-10'),
        {
            dpref: JSON.stringify({
                type: 'c.div',
                pack: {
                    defidx: 0,
                    list: [{
                        type: 'r.marketvalue',
                        pack: '{{target}}'
                    }, {
                        pack: '000001.ZICN',
                        type: 'r.end'
                    }, {
                        type: 'r.const',
                        pack: 0.01
                    }]
                }
            }),
            name: 'target-marketval-relsh'
        },

        {
            dpref: JSON.stringify({ pack: '{{target}}', type: 'r.netrate' }),
            name: 'target-netrate'
        },
        {
            dpref: JSON.stringify({ pack: '{{target}}', type: 'r.growrate' }),
            name: 'target-growrate'
        },
        {
            dpref: JSON.stringify({ pack: '{{target}}', type: 'r.amp' }),
            name: 'target-amp'
        },
        {
            dpref: JSON.stringify({
                type: 'c.div',
                pack: {
                    defidx: 1,
                    list: [{
                        type: 'r.vol',
                        pack: '{{target}}'
                    }, {
                        type: 'b.ma',
                        pack: { N: 5, dp: { pack: '{{target}}', type: 'r.vol' } }
                    }]
                }
            }),
            name: 'target-volrel-5'
        },
        {
            dpref: JSON.stringify({
                type: 'c.div',
                pack: {
                    defidx: 1,
                    list: [{
                        type: 'r.vol',
                        pack: '{{target}}'
                    }, {
                        type: 'b.ma',
                        pack: { N: 10, dp: { type: 'r.vol', pack: '{{target}}' } }
                    }]
                }
            }),
            name: 'target-volrel-10'
        }
    ]
}

export interface PreparedDataSet {
    enums: Array<{ name: string; values: string }>;
    cpdefRef: string;
    cpoutDefRefs: Array<{ name: string; dpref: string }>;
    envRefs: Array<{ name: string; dpref: string }>;
    envMap: string;
}

function marel(targetRef: string, N: number, name: string) {
    return {
        dpref: JSON.stringify({
            type: 'c.div',
            pack: {
                defidx: 1,
                list: [
                    { type: 'r.end', pack: targetRef },
                    {
                        type: 'b.ma',
                        pack: {
                            N: N,
                            dp: {
                                type: 'r.end',
                                pack: targetRef
                            }
                        }
                    }
                ]
            }
        }),
        name: name
    };
};

function volrel(targetRef: string, N1: number, N2: number, name: string) {
    return {
        dpref: JSON.stringify({
            type: 'c.div',
            pack: {
                defidx: 1,
                list: [
                    { type: 'b.ma', pack: { N: N1, dp: { pack: targetRef, type: 'r.vol' } } },
                    { type: 'b.ma', pack: { N: N2, dp: { pack: targetRef, type: 'r.vol' } } }
                ]
            }
        }),
        name: name
    };
};
