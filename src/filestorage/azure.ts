
import * as azurestorage from 'azure-storage';
import * as utility from '../utility';
import * as config from '../config';
import * as bb from 'bluebird';
import * as c from './common';
import * as path from 'path';
import Hub from "prmhub";

const afsHub = new Hub<azurestorage.BlobService>(() => {
    const afs = azurestorage.createBlobService(config.azurestorage.account, config.azurestorage.key, config.azurestorage.host);
    return bb.all([
        config.azurestorage.container.temp, config.azurestorage.container.static, config.azurestorage.container.raw, config.azurestorage.container.simconcern
    ].map(container => createContainer(afs, container)))
        .then(() => afs);
})

export function createContainer(afs: azurestorage.BlobService, container: string): bb<azurestorage.BlobService> {
    return new bb<azurestorage.BlobService>((res, rej) => {
        afs.createContainerIfNotExists(container, { publicAccessLevel: 'blob' }, err => {
            if (err)
                rej(err);
            else
                res(afs);
        });
    });
}

export function genBlobName(filename: string, dirname: string): string {
    return path.join((dirname || ''), filename).replace(/[\/\\]/g, '_').toLowerCase();
}

export function upload(buffer: Buffer | string, filename: string, dirname: string, container: string): bb<c.FileStorage> {
    return new bb<c.FileStorage>((res, rej) => {
        return afsHub.get()
            .then(afs => {
                var blobname = genBlobName(filename, dirname);
                afs.createBlockBlobFromText(container, blobname, buffer, err => {
                    if (err)
                        rej(err);
                    else
                        res({ path: blobname, container: container, storage: c.FileStorageLocation.Azure });
                });
            });
    });
}

export function uploadFromFile(fullpath: string, filename: string, dirname: string, container: string): bb<c.FileStorage> {
    return new bb<c.FileStorage>((res, rej) => {
        return afsHub.get()
            .then(function (afs) {
                var blobname = genBlobName(filename, dirname);
                afs.createBlockBlobFromLocalFile(container, blobname, fullpath, err => {
                    if (err)
                        rej(err);
                    else
                        res({ path: blobname, container: container, storage: c.FileStorageLocation.Azure });
                });
            });
    });
}

export function downloadJson<T>(container: string, path: string): bb<{ statusCode: number, data: T, header: { [key: string]: string } }> {
    return downloadUTF8(container, path)
        .then(str => {
            return {
                statusCode: str.statusCode,
                data: str.statusCode === 200 ? utility.parseJson<T>(str.data) : null,
                header: str.header
            };
        });
}

export function downloadJson2<T>(container: string, path: string): bb<T> {
    return downloadUTF82(container, path)
        .then(str => {
            return utility.parseJson<T>(str);
        });
}

export function downloadUTF8(container: string, path: string): bb<{ statusCode: number, data: string, header: { [key: string]: string } }> {
    return download(container, path)
        .then(ret => {
            return {
                statusCode: ret.statusCode,
                data: ret.statusCode === 200 ? ret.data.toString('utf8') : '',
                header: ret.headers
            };
        });
}

export function downloadUTF82(container: string, path: string): bb<string> {
    return download2(container, path)
        .then(data => {
            return data.toString('utf8');
        });
}

export function download(container: string, path: string): bb<utility.http.WebReqReturn> {
    return utility.http.webreq({
        method: 'GET',
        host: config.azurestorage.host,
        path: '/' + container + '/' + path.toLowerCase(),
        retry: 2
    });
}

export function download2(container: string, path: string): bb<Buffer> {
    return download(container, path).then(reply => {
        if (reply.statusCode === 200)
            return reply.data;
        else
            throw new Error(`bad http request in azure download: ${reply.statusCode}`);
    });
}

export function remove(container: string, blob: string): bb<void> {
    return new bb<void>(function (res, rej) {
        return afsHub.get()
            .then(function (afs) {
                afs.deleteBlob(container, blob, err => {
                    if (err)
                        rej(err);
                    else
                        res();
                });
            });
    });
}
