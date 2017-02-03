
import * as rtplan from './rtplan';
import * as rtprice from './rtprice';
import * as rtprog from './rtprog';
import * as rtprogout from './rtprogout';
import * as simtrack from './simtrack';
import * as simulate from './simulate';
import * as task from './task';
import * as storageproxy from './storageproxy';
import * as alert from './alert';
import * as alertplan from './alertplan';
import * as bb from 'bluebird';
import * as utility from '../../../utility';

export function findHandler(resx: string): (h: utility.http.HttpPack) => bb<any> {
    resx = resx.toLowerCase();
    switch (resx) {
        case 'task': return task.handler;
        case 'simulate': return simulate.handler;
        case 'simtrack': return simtrack.handler;
        case 'rtprogout': return rtprogout.handler;
        case 'rtprog': return rtprog.handler;
        case 'rtprice': return rtprice.handler;
        case 'rtplan': return rtplan.handler;
        case 'storageproxy': return storageproxy.handler;
        case 'alert': return alert.handler;
        case 'alertplan': return alertplan.handler;
        default: return null;
    }
}
