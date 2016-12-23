
import * as path from 'path';
import * as log from '../../log';
import * as http from 'http';
import * as fs from 'fs';
import * as url from 'url';
import * as mime from 'mime';
import * as config from '../../config';

export function init(port: number) {
    const sdir = path.join(__dirname, '../../../static');
    log.info(`static file dir: ${sdir}`);

    http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
        const p = url.parse(req.url).pathname;
        log.info(`${new Date().toLocaleTimeString()}: ${p}`);
        if (p.indexOf('favicon.ico') >= 0) {
            res.writeHead(404);
            res.end();
        }
        else {
            // site/admin
            let filename = path.join(sdir, config.dev && p.indexOf('/site') === 0 ? '../src/nodes/producer' : '', p);
            fs.readFile(filename, (err, data) => {
                if (err) {
                    returnAdminHtml(sdir, res);
                }
                else {
                    res.setHeader('Content-Type', mime.lookup(p));
                    res.writeHead(200);
                    res.end(data);
                }
            });
        }
    }).listen(port);
    log.info(`now producer listening at port ${port}`);
}

function returnAdminHtml(sdir: string, res: http.ServerResponse) {
    fs.readFile(path.join(sdir, 'admin.html'), (err, data) => {
        if (err) {
            console.error(err.stack);
            res.writeHead(404);
            res.end();
        }
        else {
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(data);
        }
    });
}
