
// http://hq.cs.ecitic.com/cssweb?type=GET_TICK_DETAILMAX&exchange=sz&stockcode=000001&detailtype=max&returnflag=max_first&from=1024&to=0 

const rawDataFolder = 'D:\\stock raw data2\\raw json priceadj=b wmcloud\\';

const azurestorage = {
    host: 'stockanalysis.blob.core.chinacloudapi.cn',
    account: 'stockanalysis',
    key: 'DCJWuN5xcBQv/m8SHiCdhTLY5y/35eTXsGsFqLW1jjKWoz5eKHYid6rwK2aY2ypECU1q5rnruuD0+iFd9rA+gQ==',
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
    systrack: 'systrack'
};

const timeoutCheckFreq = 2000; //in ms
const conditionCheckFreq = 2000; //in ms
const jobSchedulerCheckFreq = 10000; //in ms
const jobScheduleTime = {
    h: 11,
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

const wmCloudToken = 'bf1e63e10264f88d3d44541d4057e00981ced9e6042c19ce02c0b738f471c747';

let hypotestaggrAnalysisPort = 8083;
let producerPort = 8081;
let storageServiceHost = 'yanstock2.chinacloudapp.cn';
let storageServicePort = 8082;
let reporterPort = 80;
let dispatcherPort = 1000;
let dispatcherHost = 'yanstock2.chinacloudapp.cn';

dev = true;

if (dev) {
    reporterPort = 8080;
    storageServiceHost = '127.0.0.1';
    dispatcherHost = '127.0.0.1';
    azurestorage.container.temp = 'tempdev';
    azurestorage.container.simconcern = 'simconcerndev';
}

export {
    rawDataFolder, azurestorage, localStoragePath, rawDataExpiryInMS, maintainIdx,
    maxRawDataCached, dispatcherMongoUrl, dbCols, conditionCheckFreq, jobSchedulerCheckFreq, jobScheduleTime,
    hypotestaggrAnalysisPort, producerPort, storageServiceHost, storageServicePort, reporterPort, dispatcherHost, dispatcherPort, dev, useFiddler,
    scheduledTask, useLocalRaw, useLocalTempStore, timeoutCheckFreq, wmCloudToken
}
