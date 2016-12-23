
import * as mongodb from 'mongodb';
import * as mods from '../mods';
import * as bb from 'bluebird';
import * as validate from './validate';

export class CollClient<T> {
    private _colhub: mods.Hub<mongodb.Collection>;
    private _deffields: Object;

    getOne(filter: Object, fields?: Object): bb<T> {
        return this._colhub.get()
            .then(col => new bb<T>((res, rej) => {
                col.findOne(filter, { fields: fields || this._deffields }, (err: Error, doc: T) => {
                    if (err != null) rej(err);
                    else res(doc);
                })
            }));
    }
    getAll(filter: Object, fields?: Object, orderby?: Object): bb<Array<T>> {
        return this._colhub.get()
            .then(col => new bb<Array<T>>((res, rej) => {
                var cursor = col.find(filter, fields || this._deffields);
                if (orderby != null) cursor = cursor.sort(orderby);
                cursor.toArray((err: Error, docs: Array<T>) => {
                    if (err != null) rej(err);
                    else res(docs);
                })
            }));
    }
    getMul(filter: Object, fields: Object, orderby: Object, skip: number, take: number): bb<Array<T>> {
        return this._colhub.get()
            .then(col => new bb<Array<T>>((res, rej) => {
                var cursor = col.find(filter, fields || this._deffields);
                if (orderby != null) cursor = cursor.sort(orderby);
                cursor.limit(take + skip).skip(skip).limit(take).toArray((err: Error, docs: Array<T>) => {
                    if (err != null) rej(err);
                    else res(docs);
                })
            }));
    }
    createOne(doc: Object): bb<mongodb.ObjectID> {
        return this._colhub.get()
            .then(col => new bb<mongodb.ObjectID>((res, rej) => {
                col.insertOne(doc, (err: Error, ret: mongodb.InsertOneWriteOpResult) => {
                    if (err != null) rej(err);
                    else res(ret.insertedId);
                });
            }));
    }
    updateAll(filter: Object, update: Object, upsert: boolean): bb<{ updated: number, insertedId: mongodb.ObjectID }> {
        return this._colhub.get()
            .then(col => new bb<{ updated: number, insertedId: mongodb.ObjectID }>((res, rej) => {
                col.updateMany(filter, update, { upsert: upsert }, (err: Error, ret: mongodb.UpdateWriteOpResult) => {
                    if (err != null) rej(err);
                    else res({ updated: ret.modifiedCount, insertedId: ret.upsertedId._id });
                });
            }));
    }
    removeAll(filter: Object): bb<number> {
        return this._colhub.get()
            .then(col => new bb<number>((res, rej) => {
                col.deleteMany(filter, (err: Error, ret: mongodb.DeleteWriteOpResultObject) => {
                    if (err != null) rej(err);
                    else res(ret.deletedCount);
                });
            }))
    }
    count(filter: Object): bb<number> {
        return this._colhub.get()
            .then(col => new bb<number>((res, rej) => {
                col.count(filter, (err: Error, ct: number) => {
                    if (err != null) rej(err);
                    else res(ct);
                });
            }))
    }
    findAndModify(filter: Object, update: Object, fields: Object, returnnew: boolean, upsert: boolean, sort?: Object): bb<Object> {
        return this._colhub.get()
            .then(col => new bb<Object>((res, rej) => {
                col.findOneAndUpdate(filter, update, {
                    sort: sort || { _id: 1 },
                    returnOriginal: !returnnew,
                    upsert: upsert,
                    projection: fields || this._deffields
                }, (err: Error, ret: mongodb.FindAndModifyWriteOpResultObject) => {
                    if (err != null) rej(err);
                    else res(ret.value);
                });
            }));
    }
    bulkUpdate(arr: Array<{ filter: Object, update: Object }>, upsert: boolean): bb<void> {
        return this._colhub.get()
            .then(col => new bb<void>((res, rej) => {
                const bulk = col.initializeUnorderedBulkOp();
                for (const item of arr) {
                    if (upsert) bulk.find(item.filter).upsert().update(item.update);
                    else bulk.find(item.filter).update(item.update);
                }
                bulk.execute((err: Error, ret: mongodb.BulkWriteResult) => {
                    if (err != null) rej(err);
                    else res();
                });
            }))
    }
    bulkInsert(arr: Array<Object>): bb<Array<mongodb.ObjectID>> {
        return this._colhub.get()
            .then(col => new bb<Array<mongodb.ObjectID>>((res, rej) => {
                const bulk = col.initializeUnorderedBulkOp();
                for (const item of arr) bulk.insert(item);
                bulk.execute((err: Error, ret: mongodb.BulkWriteResult) => {
                    if (err != null) rej(err);
                    else res(<Array<mongodb.ObjectID>>ret.getInsertedIds());
                })
            }));
    }
    createIndex(index: Object): bb<void> {
        return this._colhub.get()
            .then(col => new bb<void>((res, rej) => {
                col.createIndex(index, (err: Error, ret: string) => {
                    if (err != null) rej(err);
                    else res();
                })
            }))
    }
    constructor(dbhub: mods.Hub<mongodb.Db>, collname: string, deffields: Object) {
        this._colhub = new mods.Hub<mongodb.Collection>(() => dbhub.get().then(db => db.collection(collname)));
        this._deffields = deffields;
    }
}

export class DbClient {
    private _connstr: string;
    private _dbhub: mods.Hub<mongodb.Db>;

    getCollClient<T>(collname: string, deffields: Object): CollClient<T> {
        return new CollClient<T>(this._dbhub, collname, deffields);
    }

    constructor(connstr: string) {
        this._connstr = connstr;
        this._dbhub = new mods.Hub<mongodb.Db>(() => {
            return new bb<mongodb.Db>((res, rej) => {
                mongodb.MongoClient.connect(connstr, (err: Error, db: mongodb.Db) => {
                    if (err != null) rej(err);
                    else res(db);
                })
            });
        })
    }
}

export function newId(): mongodb.ObjectID {
    return new mongodb.ObjectID();
}

export function objIdfy(obj: any): any {
    if (obj == null || obj instanceof mongodb.ObjectID)
        return obj;
    else if (validate.isObj(obj)) {
        const ret: { [name: string]: any } = {};
        for (var i in obj) {
            ret[i] = objIdfy(obj[i]);
        }
        return ret;
    }
    else if (Array.isArray(obj)) {
        return obj.map(objIdfy);
    }
    else if (objIdLike(obj)) {
        return convObjId(obj);
    }
    else
        return obj; //number, boolean
}

const charCode0 = '0'.charCodeAt(0);
const charCode9 = '9'.charCodeAt(0);
const charCodeAL = 'a'.charCodeAt(0);
const charCodeFL = 'f'.charCodeAt(0);
const charCodeAU = 'A'.charCodeAt(0);
const charCodeFU = 'F'.charCodeAt(0);
function objIdLike(str: any): boolean {
    if (str instanceof mongodb.ObjectID)
        return true;
    if (validate.isStr(str) && str.length == 24) {
        const sstr = <string>str; //for type check only
        for (var i = 0; i < 24; ++i) {
            var cc = sstr.charCodeAt(i);
            if (!((cc >= charCode0 && cc <= charCode9) || (cc >= charCodeAL && cc <= charCodeFL) || (cc >= charCodeAU && cc <= charCodeFU)))
                return false;
        }
        return true;
    }
    else
        return false;
};

export function convObjId(id: any): mongodb.ObjectID {
    if (id == null)
        return null;
    else {
        try {
            return new mongodb.ObjectID(id);
        }
        catch (err) {
            return null;
        }
    }
};
