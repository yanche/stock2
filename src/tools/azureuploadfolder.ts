
//node folder.js "D:\stock raw data\raw json" "raw"

import * as path from "path";
import * as bb from "bluebird";
import * as utility from "../utility";
import * as config from "../config";
import * as azure from "azure-storage";
import roll from "croll";

const afs = azure.createFileService(config.azurestorage.account, config.azurestorage.key);

async function uploadFiles(files: string[], folder: string, container: string) {
    const errfiles: string[] = [];
    await roll(files, f => {
        return Promise.resolve()
            .then(() => createAzureFile(container, f, path.join(folder, f)))
            .then(() => console.log(f + ' done'))
            .catch((err: Error) => { console.error(err.stack); errfiles.push(f) });
    }, Math.min(files.length, 10));
    return errfiles;
};

function createAzureFile(container: string, file: string, localfilepath: string): Promise<void> {
    return new Promise<void>((res, rej) => {
        afs.createFileFromLocalFile(container, "", file, localfilepath, (err) => {
            if (err) {
                rej(err);
            }
            else {
                res();
            }
        })
    });
}

async function uploadFolder() {
    const folder = process.argv[2], container = process.argv[3];
    console.log('folder: ' + folder);
    console.log('container: ' + container);
    let files = await utility.file.loadDir(folder);
    console.log(files.length + ' in total');
    let tryCt = 10;
    do {
        console.log('now try to upload ' + files.length + ' files.');
        files = await uploadFiles(files, folder, container);
        console.log('complete, ' + files.length + ' files failed');
        --tryCt;
    }
    while (tryCt > 0 && files.length > 0)
    console.log('try count: ' + tryCt);
    if (files.length > 0) {
        console.log('we still have ' + files.length + ' files failed uploading');
        files.forEach(f => console.log(f));
    }
};

uploadFolder()
    .then(() => console.log("done"))
    .catch(err => console.error(err))
    .then(() => process.exit(0));
