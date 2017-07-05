
import * as utility from '../utility';
import * as c from './common';
import * as bb from 'bluebird';
import * as path from 'path';
import * as config from '../config';

export function write(data: Buffer | string, filename: string, append: boolean): bb<c.FileStorage> {
    return utility.file.writeFile(filename, data, append).then(() => { return { storage: c.FileStorageLocation.Local, path: filename, container: '' }; });
}
