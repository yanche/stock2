
import * as bb from 'bluebird';
import * as fs from 'fs';

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

export function writeFile(path: string, data: Buffer | string, append?: boolean): bb<void> {
    return new bb<void>((res, rej) => {
        (append ? fs.appendFile : fs.writeFile)(path, data, err => {
            if (err != null) rej(err);
            else res();
        })
    });
}
