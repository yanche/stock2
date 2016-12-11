
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.Simulate>('simulate');
export const getMul = cm.genGetMul<d.Simulate>('simulate');
export const get = cm.genGetOne<d.Simulate>('simulate');
export const createMul = cm.genCreateMul<d.Simulate>('simulate', 2000);
export const remove = cm.genRemove('simulate');
export const bulkUpdate = cm.genBulkUpdate('simulate', false, 2000);
export const update = cm.genUpdate('simulate');
