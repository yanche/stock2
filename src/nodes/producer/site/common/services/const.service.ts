
import { Injectable } from '@angular/core';

@Injectable()
export class ConstService {
    status = {
        new: 1,
        conditionCheckInterval: 2,
        prepared: 3,
        processing: 4,
        success: 5,
        failed: 6,
        timeout: 7,
        closed: 8,
        abandoned: 9
    };

    constraints = {
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
    };

    http = {
        post: 'POST',
        get: 'GET'
    };


    action = {
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
        lastend: 'lastend',
        lastendAll: 'lastendall',
        alertsAll: 'alertsall'
    };

    simconcern = {
        viewtype: {
            dropfile: 'dropfile',
            raw: 'raw'
        }
    };

    dispatcherCond = {
        ok: 'ok',
        success: 'success',
        complete: 'complete',
        timer: 'timer',
        and: 'and',
        or: 'or'
    };
}
