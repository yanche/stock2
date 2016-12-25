
import { Injectable } from '@angular/core';
import { LogService } from './log.service';

@Injectable()
export class UtilityService {
    constructor(private _log: LogService) { }

    validate = {
        json: (str: string): boolean => {
            try {
                JSON.parse(str);
                return true;
            }
            catch (err) {
                return false;
            }
        },
        isStr: (input: any): input is string => typeof input === 'string',
        isBool: (input: any): input is boolean => typeof input === 'boolean',
        isNum: (input: any): input is number => typeof input === 'number',
        isObj: (input: any): input is Object => typeof input === 'object',
        isDate: (input: any): input is Date => input instanceof Date,
        isInt: (input: any): boolean => this.validate.isNum(input) && Math.ceil(input) === input,
        alwaysTrue: (): boolean => true,
        posNum: (input: any, int?: boolean): boolean => this.validate.isNum(input) && !isNaN(input) && input > 0 && (!int || this.validate.isInt(input)),
        posInt: (input: any): boolean => this.validate.posNum(input, true),
        negNum: (input: any, int?: boolean): boolean => this.validate.isNum(input) && !isNaN(input) && input < 0 && (!int || this.validate.isInt(input)),
        nonNegNum: (input: any, int?: boolean): boolean => this.validate.isNum(input) && !isNaN(input) && input >= 0 && (!int || this.validate.isInt(input)),
        nonPosNum: (input: any, int?: boolean): boolean => this.validate.isNum(input) && !isNaN(input) && input <= 0 && (!int || this.validate.isInt(input)),
        valueStr: (input: any): boolean => this.validate.isStr(input) && input.trim().length === input.length && input.length > 0
    }

    //returns null is cannot parse
    tryParseJson(str: string) {
        try { return JSON.parse(str); }
        catch (err) { this._log.error(err); }
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

    dateKey2DateTs(datestr: string): number {
        if (datestr.length !== 8) throw new Error(`bad format of date string: ${datestr}`);
        var year = Number(datestr.slice(0, 4)), month = Number(datestr.slice(4, 6)), date = Number(datestr.slice(6));
        if (!this.validate.nonNegNum(year, true) || !this.validate.nonNegNum(month, true) || !this.validate.nonNegNum(date, true)) throw new Error(`bad format of date-string, ${datestr}`);
        return this.msTs2DateTs(Date.UTC(year, month - 1, date));
    }

    msTs2DateTs(msts: number): number {
        return msts / this._dateMS;
    }

    private _dateMS = 60 * 60 * 24 * 1000;

    private _strRef(str: string): string {
        str = str.trim();
        if (str.length < 4) return null;
        else if (str.slice(0, 2) === '{{' && str.slice(-2) === '}}') return str.slice(2, -2);
        else return null;
    }

    refReplace(input: any, map: { [key: string]: any }): any {
        if (this.validate.isStr(input)) {
            const ref = this._strRef(input);
            return (ref == null || !(ref in map)) ? input : map[ref];
        }
        else if (this.validate.isObj(input)) {
            const ret: { [key: string]: any } = {};
            for (let i in input) {
                ret[i] = this.refReplace(input[i], map);
            }
            return ret;
        }
        else if (Array.isArray(input)) {
            return input.map(o => this.refReplace(o, map));
        }
        else return input;
    }
}
