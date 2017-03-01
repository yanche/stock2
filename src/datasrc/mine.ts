
import * as bb from 'bluebird';
import * as filestorage from '../filestorage';
import * as config from '../config';
import * as datadef from '../datadef';
import * as utility from '../utility';
import * as path from 'path';
import * as log from '../log';

export const meta = {
    stock: genStaticProvider(config.azurestorage.files.stocks.all),
    index: genStaticProvider(config.azurestorage.files.indexes.all)
}

export const targetData = {
    get: (target: string): bb<{ statusCode: number, data: datadef.RawData }> => {
        return (config.useLocalRaw ? utility.file.loadJsonFile<datadef.RawData>(path.join(config.rawDataFolder, `${target}.json`))
            .then(r => {
                return { statusCode: 200, data: r };
            })
            .catch((err: Error) => {
                log.error(err.stack);
                return { statusCode: 404, data: null };
            }) : filestorage.azure.downloadJson<datadef.RawData>(config.azurestorage.container.raw, `${target}.json`))
            .then(reply => {
                return {
                    statusCode: reply.statusCode,
                    data: reply.data
                };
            });
    },
    get2: (target: string): bb<datadef.RawData> => {
        return config.useLocalRaw ? utility.file.loadJsonFile<datadef.RawData>(path.join(config.rawDataFolder, `${target.toLowerCase()}.json`)) : filestorage.azure.downloadJson2<datadef.RawData>(config.azurestorage.container.raw, `${target}.json`);
    },
    upload: (target: string, data: datadef.RawData): bb<filestorage.common.FileStorage> => {
        return filestorage.azure.upload(JSON.stringify(data), `${target}.json`, null, config.azurestorage.container.raw);
    }
}

function genStaticProvider(files: { txt: string, json: string }) {
    return {
        getNames: (): bb<Array<string>> => {
            return filestorage.azure.downloadUTF82(config.azurestorage.container.static, files.txt)
                .then(str => str.split(';'));
        },
        get: (): bb<Array<datadef.TargetInfo>> => {
            return filestorage.azure.downloadJson2<Array<datadef.TargetInfo>>(config.azurestorage.container.static, files.json);
        },
        uploadNames: (names: Array<string>): bb<filestorage.common.FileStorage> => {
            return filestorage.azure.upload(names.join(';'), files.txt, null, config.azurestorage.container.static);
        },
        upload: (list: Array<datadef.TargetInfo>): bb<filestorage.common.FileStorage> => {
            return filestorage.azure.upload(JSON.stringify(list), files.json, null, config.azurestorage.container.static);
        }
    };
}
