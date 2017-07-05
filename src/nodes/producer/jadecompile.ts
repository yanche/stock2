
import * as jade from 'jade';
import * as utility from '../../utility';
import * as bb from 'bluebird';
import * as path from 'path';
import * as config from '../../config';

const filenameAdmin = 'admin';
const filenameUser = 'user';

const env = {
    environment: {
        dispatcher: {
            host: config.dispatcherHost,
            port: config.dispatcherPort
        },
        storage: {
            host: config.storageHost,
            port: config.storagePort
        },
        azurestorage: config.azurestorage.host,
        containers: {
            static: config.azurestorage.container.static
        }
    },
    resources: {
        allstocks: config.azurestorage.files.stocks.all.txt,
        allindexes: config.azurestorage.files.indexes.all.txt,
        allstocksJson: config.azurestorage.files.stocks.all.json,
        allindexesJson: config.azurestorage.files.indexes.all.json
    }
};

bb.resolve()
    .then(() => utility.file.writeFile(
        path.join(__dirname, `./${filenameAdmin}.html`),
        jade.compileFile(path.join(__dirname, `./${filenameAdmin}.jade`), { pretty: true })(env)
    ))
    .then(() => console.log(`${filenameAdmin}.jade compiled`))
    .then(() => utility.file.writeFile(
        path.join(__dirname, `./${filenameUser}.html`),
        jade.compileFile(path.join(__dirname, `./${filenameUser}.jade`), { pretty: true })(env)
    ))
    .then(() => console.log(`${filenameUser}.jade compiled`))
    .catch(err => { console.error(err.stack); })
    .then(() => {
        process.exit(0);
    });
