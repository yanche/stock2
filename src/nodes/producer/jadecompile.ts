
import * as jade from 'jade';
import * as utility from '../../utility';
import * as bb from 'bluebird';
import * as path from 'path';
import * as config from '../../config';

const filename = 'admin';

bb.resolve()
    .then(() => utility.file.writeFile(
        path.join(__dirname, `./${filename}.html`),
        jade.compileFile(path.join(__dirname, `./${filename}.jade`), { pretty: true })({
            environment: {
                dispatcher: {
                    host: config.dispatcherHost,
                    port: config.dispatcherPort
                },
                azurestorage: config.azurestorage.host,
                containers: {
                    static: config.azurestorage.container.static
                }
            }
        })
    ))
    .catch(err => { console.error(err.stack); })
    .then(() => {
        console.log(`${filename}.jade compiled`);
        process.exit(0);
    });
