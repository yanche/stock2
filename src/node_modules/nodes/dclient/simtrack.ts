
import * as cm from './common';
import * as d from '../def';

export const update = cm.genUpdate('simtrack');

export function getOrCreate(filter: { target: string, rtplanId: string }, fields?: Object) {
    return cm.expectJson<d.SimTrack>('POST', 'simtrack', { filter: filter, fields: fields }, 1, { verb: 'GETORCREATE' });
}
