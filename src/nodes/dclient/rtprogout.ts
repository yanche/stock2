
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.RtprogOut>('rtprogout');
export const getMul = cm.genGetMul<d.RtprogOut>('rtprogout');
export const get = cm.genGetOne<d.RtprogOut>('rtprogout');
export const createMul = cm.genCreateMul<d.RtprogOut>('rtprogout', 2000);
export const remove = cm.genRemove('rtprogout');
export const bulkUpdate = cm.genBulkUpdate('rtprogout', false, 2000);
