
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.AlertPlan>('alertplan');
export const getMul = cm.genGetMul<d.AlertPlan>('alertplan');
export const get = cm.genGetOne<d.AlertPlan>('alertplan');
