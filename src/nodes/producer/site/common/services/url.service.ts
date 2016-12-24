
/// <reference path="../../environment.d.ts" />

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
export class UrlService {
    dispatcher(resource: string) {
        const port = (environment.dispatcher.port && environment.dispatcher.port !== 80) ? (':' + environment.dispatcher.port) : '';
        return `http://${environment.dispatcher.host}${port}/${resource}`;
    }

    blob(blobname: string, container?: string) {
        return `http://${environment.azurestorage}/${container || environment.containers.static}/${blobname}`;
    }
}
