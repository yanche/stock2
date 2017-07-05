
import * as config from '../../../config';
import * as utility from '../../../utility';

const dbc = new utility.mongo.DbClient(config.dispatcherMongoUrl);

const systrackFields = {
    _id: 1,
    pack: 1,
};

const systrack = dbc.getCollClient<SysTrack>(config.dbCols.systrack, systrackFields);

export { systrack };

export interface SysTrack {
    _id?: string;
    pack?: any;
}
