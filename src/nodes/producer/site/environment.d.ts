
declare const environment: {
    dispatcher: {
        host: string;
        port: number;
    },
    storage: {
        host: string;
        port: number;
    },
    azurestorage: string;
    containers: {
        static: string
    }
}

declare const resources: {
    allstocks: string;
    allindexes: string;
    allstocksJson: string;
    allindexesJson: string;
}

declare const verb: {
    CREATEMUL: string;
    CREATEONE: string;
    GETMUL: string;
    GETONE: string;
    REPORT: string;
    DISPATCH: string;
    UPGRADE: string;
    CLOSE: string;
    RENEW: string;
    MAKEREADY: string;
    // not for dispatcher
    GETALL: string;
    REMOVE: string;
    UPDATE: string;
    UPSERT: string;
    BULKUPSERT: string;
    BULKUPDATE: string;
    GETORCREATE: string;
};
