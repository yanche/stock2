
import * as http from 'http';
import * as https from 'https';
import * as bb from 'bluebird';
import * as config from '../config';
import * as _ from 'lodash';
import * as validate from './validate';
import * as url from 'url';

export interface WebReqOptions extends https.RequestOptions {
    _retrying?: boolean;
    retry?: number;
    timeout?: number;
}

export interface WebReqReturn {
    statusCode: number,
    headers: { [key: string]: string },
    data: Buffer
}

export function webreq(options: WebReqOptions, body?: Buffer | Object | Array<any> | string, secure?: boolean) {
    return new bb<WebReqReturn>((resolve, reject) => {
        if (config.useFiddler && !options._retrying) {
            options.path = (secure ? 'https://' : 'http://') + options.host + (options.port ? (':' + options.port) : '') + options.path;
            if (options.headers == null)
                options.headers = {};
            options.headers['host'] = options.host;
            options.host = '127.0.0.1';
            options.port = 8888;
        }
        var req = ((secure && !config.useFiddler) ? https.request : http.request)(options, (res: http.IncomingMessage) => {
            var bufs = new Array<Buffer>();
            res.on('data', (d: Buffer) => {
                bufs.push(d);
            }).on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: Buffer.concat(bufs)
                });
            });
        });
        if (options.timeout != null) {
            req.setTimeout(options.timeout, () => {
                var err = new Error(`http${secure ? 's' : ''} call timeout`);
                //err.code = 'ETIMEDOUT';
                reject(err);
            });
        }
        if (body != null && (typeof body === 'object' || Array.isArray(body))) {
            req.setHeader('Content-Type', 'application/json');
            req.end(JSON.stringify(body));
        }
        else if (typeof body === 'string') {
            req.setHeader('Content-Type', 'text/plain');
            req.end(body);
        }
        else
            req.end(body); //null or Buffer
        req.on('error', (err: Error) => {
            if (options.retry == null || options.retry <= 0)
                reject(err);
            else {
                webreq(<WebReqOptions>_.extend({}, options, { retry: options.retry - 1, _retrying: true }), body, secure)
                    .then(resolve, reject);
            }
        });
    });
};

export class HttpPack {
    private _reqheaders: { [name: string]: string };
    private _headers: Map<string, string>;
    private _reqbodybuf: Buffer;
    private _reqbody: any;
    private _bodybuf: Buffer;
    private _status: number;
    private _req: http.IncomingMessage;
    private _res: http.ServerResponse;
    private _sent: boolean;
    private _url: url.Url;

    getReqHeader(name: string): string {
        return this._reqheaders[name.toLowerCase()];
    }
    setResHeader(name: string, value: string): this {
        this._headers.set(name, value);
        return this;
    }
    get method(): string { return this._req.method.toUpperCase(); };
    get reqbody(): any {
        if (this._reqbody != null) return this._reqbody;
        const ct = this.getReqHeader('content-type');
        if (ct === 'application/json' || ct === 'text/json') this._reqbody = JSON.parse(this._reqbodybuf.toString('utf8'));
        else throw new Error(`unknown content-type to process request body: ${ct}`);
        return this._reqbody;
    }
    get path(): string {
        return this._url.pathname;
    }
    set body(value: Object | string | Buffer) {
        if (this._bodybuf != null) throw new Error('http response body has already been set');
        else if (value == null) throw new Error('does not accept null input');
        else {
            var bodybuf: Buffer = null, type = '';
            if (validate.isObj(value)) {
                bodybuf = new Buffer(JSON.stringify(value), 'utf8');
                type = 'application/json; charset=utf-8';
            }
            else if (validate.isStr(value)) {
                bodybuf = new Buffer(value);
                type = 'text/plain';
            }
            else {
                bodybuf = <Buffer>value;
                type = '';
            }
            this._bodybuf = bodybuf;
            this._headers.set('Content-Type', type);
        }
    }
    set status(value: number) {
        this._status = value;
    }
    init(): bb<void> {
        return new bb<void>((res, rej) => {
            const bufs = new Array<Buffer>();
            this._req.on('data', (chunk: Buffer) => { bufs.push(chunk); });
            this._req.on('end', () => {
                this._reqbodybuf = Buffer.concat(bufs);
                res();
            });
            this._req.on('error', rej);
        });
    }
    send() {
        if (this._sent) throw new Error('http response already sent');
        this._sent = true;
        if (this._status == null) this._status = 200;
        this._res.statusCode = this._status;
        for (const h of this._headers) {
            this._res.setHeader(h[0], h[1]);
        }
        this._res.end(this._bodybuf);
    }
    constructor(req: http.IncomingMessage, res: http.ServerResponse) {
        this._reqheaders = req.headers;
        this._headers = new Map<string, string>();
        this._status = null;
        this._req = req;
        this._res = res;
        this._sent = false;
        this._url = url.parse(req.url, true);
    }
}
