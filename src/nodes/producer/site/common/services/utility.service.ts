
import { Injectable } from '@angular/core';
import { LogService } from './log.service';

@Injectable()
export class UtilityService {
    //constructor(private _log: LogService) { }

    valid = {
        json: (str: string): boolean => {
            try {
                JSON.parse(str);
                return true;
            }
            catch (err) {
                return false;
            }
        },
        isStr: (input: any): input is string => {
            return typeof input === 'string';
        },
        isBool: (input: any): input is boolean => {
            return typeof input === 'boolean';
        },
    }

    //returns null is cannot parse
    tryParseJson(str: string) {
        return JSON.parse(str);
        // try { return JSON.parse(str); }
        // catch (err) { this._log.error(err); }
    }

    convParamStr(str: string): string | number | boolean {
        str = str.trim();
        var numVal = str.length > 0 ? Number(str) : Number.NaN;
        if (!isNaN(numVal))
            return numVal;
        else if (str.toLowerCase() === 'true')
            return true;
        else if (str.toLowerCase() === 'false')
            return false;
        else
            return str;
    }
}
