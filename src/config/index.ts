
// http://hq.cs.ecitic.com/cssweb?type=GET_TICK_DETAILMAX&exchange=sz&stockcode=000001&detailtype=max&returnflag=max_first&from=1024&to=0 

const rawDataFolder = 'D:\\stock raw data3';

const azurestorage = {
    host: 'yanstorage0609.blob.core.windows.net',
    account: 'yanstorage0609',
    key: 'HXTpjyrLqZZ2XnJ0r8sFB8JxPYg9GoXBoT3jmkUdrys4I43iR6XZM9BH1jXVgmzbD9EukAPgtSGcRGDG5Wtzvw==',
    container: {
        static: 'newsysstatic',
        raw: 'newsysraw',
        temp: 'newsystemp',
        //profile: 'newsys_profile',
        //lhb: 'newsys_lhb',
        simconcern: 'newsyssimconcern'
    },
    files: {
        //valid(on trade) targets
        stocks: {
            all: {
                json: 'allstocks.json',
                txt: 'allstocks.txt',
            },
        },
        //kinds of indexes
        indexes: {
            all: {
                json: 'allindexes.json',
                txt: 'allindexes.txt',
            },
        },
        // groups: {
        //     //[{group: '青海', targets: [{name: '青海明胶', target: '000606.XSHE'}]}]
        //     ths: {
        //         region: 'ths_meta_region.json',
        //         industry: 'ths_meta_industry.json'
        //     }
        // }
    }
}

const localStoragePath = 'D:\\stock temp';

const rawDataExpiryInMS = 60 * 10 * 1000; //ten minute of expiration

const maintainIdx = ['000001.ZICN', '399001.ZICN', '399005.ZICN', '399006.ZICN', '399300.ZICN', '399905.ZICN', '000016.ZICN'];

const maxRawDataCached = 10;

const dispatcherMongoUrl = 'mongodb://127.0.0.1:27017/stock?w=majority';

const dbCols = {
    task: 'task',
    rtplan: 'rtplan',
    simulate: 'simulate',
    simtrack: 'simtrack',
    rtprog: 'rtprog',
    rtprogout: 'rtprogout',
    rtprice: 'rtprice',
    systrack: 'systrack',
    alertplan: 'alertplan',
    alert: 'alert'
};

const timeoutCheckFreq = 2000; //in ms
const conditionCheckFreq = 2000; //in ms
const jobSchedulerCheckFreq = 10000; //in ms
const jobScheduleTime = {
    h: 21, //china local time (hour)
    m: 0
}

let dev = false, useFiddler = false, scheduledTask = false, useLocalRaw = false, useLocalTempStore = false;

const ctrl = process.argv[process.argv.length - 1];
if (ctrl[0] == '-') {
    for (let i = 1; i < ctrl.length; ++i) {
        let v = ctrl[i];
        switch (v) {
            case 'd':
                dev = true;
                break;
            case 'f':
                useFiddler = true;
                break;
            case 's':
                scheduledTask = true;
                break;
            case 'l':
                useLocalRaw = true;
                break;
            case 't':
                useLocalTempStore = true;
                break;
            default:
                console.log('unrecognized run-time config: ' + v);
                break;
        }
    }
    if (dev || useFiddler || scheduledTask || useLocalRaw || useLocalTempStore) {
        console.log('run-time config:');
        if (dev)
            console.log('dev mode, any dispatcher connection will point to 127.0.0.1');
        if (useFiddler)
            console.log('fiddler mode, any http request will use 127.0.0.1:8888 as proxy');
        if (scheduledTask)
            console.log('scheduled task will be created by inspector');
        if (useLocalRaw)
            console.log('use local raw files from: ' + rawDataFolder);
        if (useLocalTempStore)
            console.log('use local temp storage: ' + localStoragePath);
    }
    else
        console.log('no run-time config available, now run as 100% prod mode');
}

// const wmCloudToken = 'bf1e63e10264f88d3d44541d4057e00981ced9e6042c19ce02c0b738f471c747';
const wmCloudToken = 'b71447597b422cbd6154e4d49feaa00f57536e5abb533909db232c29c9973c13';
const wmTrialDays = 180;

let hypotestaggrAnalysisPort = 1341;
let producerPort = 1340;
let reporterPort = 1338;
let dispatcherPort = 1339;
let dispatcherHost = 'hikerjoy.cloudapp.net';
let storagePort = 1339;
let storageHost = 'hikerjoy.cloudapp.net';

if (dev) {
    // reporterPort = 1337;
    storageHost = dispatcherHost = '127.0.0.1';
    azurestorage.container.temp = 'tempdev';
    azurestorage.container.simconcern = 'simconcerndev';
}

export {
    rawDataFolder, azurestorage, localStoragePath, rawDataExpiryInMS, maintainIdx,
    maxRawDataCached, dispatcherMongoUrl, dbCols, conditionCheckFreq, jobSchedulerCheckFreq, jobScheduleTime,
    hypotestaggrAnalysisPort, producerPort, reporterPort, dispatcherHost, dispatcherPort, dev, useFiddler,
    scheduledTask, useLocalRaw, useLocalTempStore, timeoutCheckFreq, wmCloudToken, wmTrialDays, storageHost, storagePort
}
