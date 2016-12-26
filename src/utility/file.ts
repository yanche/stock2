
import * as bb from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

export function loadFile(path: string): bb<Buffer> {
    return new bb<Buffer>((res, rej) => {
        fs.readFile(path, (err: Error, data: Buffer) => {
            if (err != null) rej(err);
            else res(data);
        })
    });
}

export function loadJsonFile<T>(path: string): bb<T> {
    return loadFile(path).then(data => {
        return <T>JSON.parse(data.toString('utf8'));
    })
}

export function writeFile(filename: string, data: Buffer | string, append?: boolean): bb<void> {
    return new bb<void>((res, rej) => {
        mkdirp(path.dirname(filename), err => {
            if (err) rej(err);
            else {
                (append ? fs.appendFile : fs.writeFile)(filename, data, err => {
                    if (err != null) rej(err);
                    else res();
                })
            }
        })
    });
}
