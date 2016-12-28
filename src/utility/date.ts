
import * as utility from './index';
import * as moment from 'moment';

const dateMS = 1000 * 60 * 60 * 24;
export function dateTs(year: number, month: number, date: number): number {
    var d = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    if (d.getUTCDate() !== date || d.getUTCMonth() !== month || d.getUTCFullYear() !== year) throw new Error(`bad data for date-ts: ${year}-${month}-${date}`);
    return msTs2DateTs(d.getTime());
}

export function msTs2DateTs(msts: number): number {
    return msts / dateMS;
}

export function dateTs2MsTs(datets: number): number {
    return datets * dateMS;
}

function put0PadString(str: string, tolen: number): string {
    return str.length >= tolen ? str : put0PadString(`0${str}`, tolen);
}

export function dateOffset(date: Date | number, options: { year?: number, month?: number, day?: number, hour?: number, minute?: number, second?: number, ms?: number }): Date {
    var ret = typeof date === 'number' ? new Date(date) : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
    if (options.year != null) ret.setUTCFullYear(ret.getUTCFullYear() + options.year);
    if (options.month != null) ret.setUTCMonth(ret.getUTCMonth() + options.month);
    if (options.day != null) ret.setUTCDate(ret.getUTCDate() + options.day);
    if (options.hour != null) ret.setUTCHours(ret.getUTCHours() + options.hour);
    if (options.minute != null) ret.setUTCMinutes(ret.getUTCMinutes() + options.minute);
    if (options.second != null) ret.setUTCSeconds(ret.getUTCSeconds() + options.second);
    if (options.ms != null) ret.setUTCMilliseconds(ret.getUTCMilliseconds() + options.ms);
    return ret;
}

export function datetimeFormat(date: Date | number, utc?: boolean): string {
    return dateFormat(date, 'YYYY/MM/DD HH:mm:ss', utc);
}

export function dateTsFormat(datets: number): string {
    return dateFormat(dateTs2MsTs(datets));
}

export function dateFormat(date: Date | number, format?: string, utc?: boolean): string {
    var d: Date = null;
    if (typeof date === 'number') d = new Date(date);
    else d = date;
    return (utc ? moment.utc(d) : moment(d)).format(format || 'YYYY/MM/DD');
}

export function nowUTCTs():number {
    return Math.floor(new Date().getTime() / dateMS) * dateMS;
}

function dateStrParserGen(sym: string): (datestr: string) => number {
    return (datestr: string): number => {
        if (datestr.length !== 10 || datestr[4] !== sym || datestr[7] !== sym) throw new Error(`bad format of date string: ${datestr}`);
        var year = Number(datestr.slice(0, 4)), month = Number(datestr.slice(5, 7)), date = Number(datestr.slice(8));
        if (!utility.validate.nonNegNum(year, true) || !utility.validate.nonNegNum(month, true) || !utility.validate.nonNegNum(date, true)) throw new Error(`bad format of date-string, ${datestr}`);
        return Date.UTC(year, month - 1, date);
    };
}

// 2015-12-05 -> utc timestamp
export const dashDateStrParse = dateStrParserGen('-');
// 2015/12/05 -> utc timestamp
export const slashDateStrParse = dateStrParserGen('/');

export function dateKey2DateTs(datestr: string): number {
    if (datestr.length !== 8 ) throw new Error(`bad format of date string: ${datestr}`);
    var year = Number(datestr.slice(0, 4)), month = Number(datestr.slice(4, 6)), date = Number(datestr.slice(6));
    if (!utility.validate.nonNegNum(year, true) || !utility.validate.nonNegNum(month, true) || !utility.validate.nonNegNum(date, true)) throw new Error(`bad format of date-string, ${datestr}`);
    return msTs2DateTs(Date.UTC(year, month - 1, date));
}

export function dateTs2DateKey(datets: number): string {
    const date = new Date(dateTs2MsTs(datets));
    return `${put0PadString(date.getUTCFullYear().toString(), 4)}${put0PadString((date.getUTCMonth() + 1).toString(), 2)}${put0PadString(date.getUTCDate().toString(), 2)}`;
}
