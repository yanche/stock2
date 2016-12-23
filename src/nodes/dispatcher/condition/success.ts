
import * as i from './index';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import * as db from '../db';
import * as constant from '../../../const';

const success: i.Condition = {
    resolve(pack: Array<string> | string): bb<boolean> {
        return bb.resolve().then(() => {
            if (!success.validate(pack)) throw new Error('condition.success, bad input');
            var fid: Object = null;
            if (Array.isArray(pack))
                fid = { $in: pack.map(utility.mongo.convObjId) };
            else
                fid = utility.mongo.convObjId(pack);
            return bb.all([
                db.task.count({ _id: fid }),
                db.task.getOne({ _id: fid, statusId: { $ne: constant.task.status.success } }, { _id: 1 })
            ])
                .then(d => {
                    const expcount = Array.isArray(pack) ? pack.length : 1;
                    if (d[0] === expcount) return d[1] == null;
                    else throw new Error(`condition.success, count not match, expected: ${expcount}, actual: ${d[0]}`);
                })
        });
    },
    validate(pack: Array<string> | string): boolean {
        if (Array.isArray(pack))
            return pack.length > 0 && utility.array.unique(pack).length === pack.length && pack.every(p => utility.validate.isStr(p) && utility.mongo.convObjId(p) != null);
        else
            return utility.validate.isStr(pack) && utility.mongo.convObjId(pack) != null;
    }
}

export default success;
