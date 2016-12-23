
import * as utility from '../utility';
import * as c from './common';
import * as bb from 'bluebird';
import * as path  from 'path';
import * as config  from '../config';

export function write(data: Buffer | string, filename: string, append: boolean): bb<c.FileStorage> {
    var p = path.join(config.localStoragePath, filename).toLowerCase();
    return utility.file.writeFile(p, data, append).then(() => { return { storage: c.FileStorageLocation.Local, path: p, container: '' }; });
}