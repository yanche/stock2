
//node folder.js "D:\stock raw data\raw json" "raw"

import * as path from "path";
import * as bb from "bluebird";
import * as mods from "../mods";
import * as utility from "../utility";
import * as filestorage from "../filestorage";

async function uploadFiles(files: string[], folder: string, container: string) {
    const errfiles: string[] = [];
    await mods.roll(files, f => {
        return bb.resolve()
            .then(() => utility.file.loadFile(path.join(folder, f)))
            .then(bytes => filestorage.azure.upload(bytes, f, '', container))
            .then(() => console.log(f + ' done'))
            .catch(() => errfiles.push(f));
    }, Math.min(files.length, 10));
    return errfiles;
};

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
