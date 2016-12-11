
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.Rtprice>('rtprice');
export const getMul = cm.genGetMul<d.Rtprice>('rtprice');
export const get = cm.genGetOne<d.Rtprice>('rtprice');
export const remove = cm.genRemove('rtprice');
export const bulkUpsert = cm.genBulkUpdate('rtprice', true, 2000);
export const upsert = cm.genUpsert('rtprice');
