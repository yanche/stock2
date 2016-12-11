
import * as cm from './common';
import * as d from '../def';

export const getAll = cm.genGetAll<d.Rtplan>('rtplan');
export const getMul = cm.genGetMul<d.Rtplan>('rtplan');
export const get = cm.genGetOne<d.Rtplan>('rtplan');
