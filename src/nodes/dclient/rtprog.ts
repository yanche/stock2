
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.Rtprog>('rtprog');
export const getMul = cm.genGetMul<d.Rtprog>('rtprog');
export const get = cm.genGetOne<d.Rtprog>('rtprog');
export const create = cm.genCreate<d.Rtprog>('rtprog');
export const createMul = cm.genCreateMul<d.Rtprog>('rtprog', 2000);
export const remove = cm.genRemove('rtprog');
export const bulkUpdate = cm.genBulkUpdate('rtprog', false, 2000);
export const bulkUpsert = cm.genBulkUpdate('rtprog', true, 2000);
export const upsert = cm.genUpsert('rtprog');
