
import * as rtplan from './rtplan';
import * as rtprice from './rtprice';
import * as rtprog from './rtprog';
import * as rtprogout from './rtprogout';
import * as simtrack from './simtrack';
import * as simulate from './simulate';
import * as alert from './alert';
import * as alertplan from './alertplan';
import * as storageproxy from './storageproxy';
import * as bb from 'bluebird';
import * as utility from '../../../utility';

export function findHandler(resx: string): (h: utility.http.HttpPack) => bb<any> {
    resx = resx.toLowerCase();
    switch (resx) {
        case 'simulate': return simulate.handler;
        case 'simtrack': return simtrack.handler;
        case 'rtprogout': return rtprogout.handler;
        case 'rtprog': return rtprog.handler;
        case 'rtprice': return rtprice.handler;
        case 'rtplan': return rtplan.handler;
        case 'alert': return alert.handler;
        case 'alertplan': return alertplan.handler;
        case 'storageproxy': return storageproxy.handler;
        default: return null;
    }
}
