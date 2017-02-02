
import * as mongodb from 'mongodb';
import * as bb from 'bluebird';
import * as utility from '../src/utility';
import * as def from '../src/nodes/def';

function importFromFile_AllScope(fullpath: string, dbcol: mongodb.Collection) {
    console.log('importing: ' + fullpath);
    return utility.file.loadJsonFile<def.Rtplan>(fullpath)
    .then(j => {
        return new bb((res, rej) => {
            if(j._id == null)
                rej(new Error('_id not exists in loaded json: ' + fullpath));
            else {
                dbcol.update({ _id: j._id }, {
                    $set: {
                        targetScope: j.targetScope,
                        cpdefRef: j.cpdefRef,
                        cpoutdefRef: j.cpoutdefRef,
                        createdTs: new Date().getTime(),
                        comments: j.comments,
                        name: j.name,
                        doc: j.doc,
                        lookback: j.lookback,
                        glong: j.glong,
                        startDateTs: j.startDateTs,
                        runrt: Boolean(j.runrt),
                        concerns: j.concerns,
                    }
                }, { upsert: true }, (err, rets) => {
                    if (err)
                        rej(err);
                    else
                        res();
                });
            }
        });
    });
};

function getDbCol() {
    return new bb<mongodb.Collection>((res, rej)=>{
        mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/stock?w=majority', (err, db) => {
            if (err)
                rej(err);
            else
                res(db.collection('rtplan'));
        });
    });
};

getDbCol()
.then(dbcol => {
    return bb.all([
        importFromFile_AllScope('./bdev/stocks/bdev-macd-diff-100-200-80-nhold300-threshold0.4.json', dbcol),
        importFromFile_AllScope('./bdev/stocks/bdev-macd-macd-100-200-80-nhold300-threshold0.4.json', dbcol),
        importFromFile_AllScope('./bdev/stocks/bdev-macd-dea-100-200-80-nhold300-threshold0.4.json', dbcol),
        importFromFile_AllScope('./bdev/indexes/bdev-macd-diff-100-200-80-nhold300-threshold0.8.json', dbcol),
        importFromFile_AllScope('./bdev/indexes/bdev-macd-macd-100-200-80-nhold300-threshold0.8.json', dbcol),
        importFromFile_AllScope('./bollbreak/bollbreak-200-nhold200.json', dbcol),
        //importFromFile_AllScope('./test.json', dbcol)
    ]);
})
.catch(function (err) {
    console.error(err.stack);
})
.then(function () {
    console.log('done');
    process.exit(0);
});
