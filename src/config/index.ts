
// contains all prod settings
import * as path from "path";
process.env["NODE_CONFIG_DIR"] = path.join(__dirname, "../../config");
import * as config from "config";

// http://hq.cs.ecitic.com/cssweb?type=GET_TICK_DETAILMAX&exchange=sz&stockcode=000001&detailtype=max&returnflag=max_first&from=1024&to=0 

const rawDataFolder = config.get<string>("rawDataFolder");

const azurestorage = {
    host: config.get<string>("azurestorage.host"),
    account: config.get<string>("azurestorage.account"),
    key: config.get<string>("azurestorage.key"),
    container: {
        static: "newsysstatic",
        raw: "newsysraw",
        temp: "newsystempdev",
        simconcern: "newsyssimconcerndev"
    },
    files: {
        //valid(on trade) targets
        stocks: {
            all: {
                json: "allstocks.json",
                txt: "allstocks.txt",
            },
        },
        //kinds of indexes
        indexes: {
            all: {
                json: "allindexes.json",
                txt: "allindexes.txt",
            },
        }
    }
}

const localStoragePath = config.get<string>("localStoragePath");

const rawDataExpiryInMS = 60 * 10 * 1000; //ten minute of expiration

const maintainIdx = ["000001.ZICN", "399001.ZICN", "399005.ZICN", "399006.ZICN", "399300.ZICN", "399905.ZICN", "000016.ZICN"];

const maxRawDataCached = 10;

let dispatcherMongoUrl = "mongodb://127.0.0.1:27017/stock?w=majority";
let storageMongoUrl = dispatcherMongoUrl;

const dbCols = {
    task: "task",
    rtplan: "rtplan",
    simulate: "simulate",
    simtrack: "simtrack",
    rtprog: "rtprog",
    rtprogout: "rtprogout",
    rtprice: "rtprice",
    systrack: "systrack",
    alertplan: "alertplan",
    alert: "alert"
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
if (ctrl[0] == "-") {
    for (let i = 1; i < ctrl.length; ++i) {
        let v = ctrl[i];
        switch (v) {
            case "d":
                dev = true;
                break;
            case "f":
                useFiddler = true;
                break;
            case "s":
                scheduledTask = true;
                break;
            case "l":
                useLocalRaw = true;
                break;
            case "t":
                useLocalTempStore = true;
                break;
            default:
                console.log("unrecognized run-time config: " + v);
                break;
        }
    }
    if (dev || useFiddler || scheduledTask || useLocalRaw || useLocalTempStore) {
        console.log("run-time config:");
        if (dev)
            console.log("dev mode, any dispatcher connection will point to 127.0.0.1");
        if (useFiddler)
            console.log("fiddler mode, any http request will use 127.0.0.1:8888 as proxy");
        if (scheduledTask)
            console.log("scheduled task will be created by inspector");
        if (useLocalRaw)
            console.log("use local raw files from: " + rawDataFolder);
        if (useLocalTempStore)
            console.log("use local temp storage: " + localStoragePath);
    }
    else
        console.log("no run-time config available, now run as 100% prod mode");
}

const wmCloudToken = config.get<string>("wmCloudToken");
const wmTrialDays = 180;

let hypotestaggrAnalysisPort = 1341;
let producerPort = 1340;
let reporterPort = 1338;
let dispatcherPort = 1339;
let dispatcherHost = "127.0.0.1";
let storageHost = dispatcherHost;
let storagePort = 1342;

if (!dev) {
    dispatcherHost = config.get<string>("dispatcherHost");
    storageHost = config.get<string>("storageHost");
    azurestorage.container.temp = "newsystemp";
    azurestorage.container.simconcern = "newsyssimconcern";
    dispatcherMongoUrl = config.get<string>("dispatcherMongoUrl");
    storageMongoUrl = config.get<string>("storageMongoUrl");
}

export {
    rawDataFolder, azurestorage, localStoragePath, rawDataExpiryInMS, maintainIdx,
    maxRawDataCached, dispatcherMongoUrl, storageMongoUrl, dbCols, conditionCheckFreq, jobSchedulerCheckFreq, jobScheduleTime,
    hypotestaggrAnalysisPort, producerPort, reporterPort, dispatcherHost, dispatcherPort, dev, useFiddler,
    scheduledTask, useLocalRaw, useLocalTempStore, timeoutCheckFreq, wmCloudToken, wmTrialDays, storageHost, storagePort
}
