
import * as bb from 'bluebird';
import * as utility from '../utility';
import * as azure from './azure';
import * as local from './local';
import * as config from '../config';
import * as path from "path";

interface FileStorage {
    storage: FileStorageLocation,
    container: string,
    path: string
}

enum FileStorageLocation {
    Azure = 1,
    Local = 2
}

export function getBytes(drop: FileStorage): bb<Buffer> {
    switch (drop.storage) {
        case FileStorageLocation.Azure: return azure.download2(drop.container, drop.path);
        case FileStorageLocation.Local: return utility.file.loadFile(drop.path);
        default: throw new Error(`unknown file-storage-location, ${drop.storage}`);
    }
}

export function getUTF8(drop: FileStorage): bb<string> {
    return getBytes(drop).then(data => data.toString('utf8'));
}

export function getJson<T>(drop: FileStorage): bb<T> {
    return getUTF8(drop).then(str => utility.parseJson<T>(str));
}

export function writeTempBytes(bytes: Buffer | string, fname: string): bb<FileStorage> {
    if (config.useLocalTempStore)
        return local.write(bytes, path.join(config.localStoragePath, fname).toLowerCase(), false);
    else
        return azure.upload(bytes, fname, null, config.azurestorage.container.temp);
};

export { FileStorage, FileStorageLocation }
