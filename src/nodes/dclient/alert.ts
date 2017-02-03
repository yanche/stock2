
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.Alert>('alert');
export const getMul = cm.genGetMul<d.Alert>('alert');
export const get = cm.genGetOne<d.Alert>('alert');
export const update = cm.genUpdate('alert');
export const bulkUpdate = cm.genBulkUpdate('alert', false, 2000);
export const createMul = cm.genCreateMul<d.Alert>('alert', 2000);
export const create = cm.genCreate<d.Alert>('alert');
