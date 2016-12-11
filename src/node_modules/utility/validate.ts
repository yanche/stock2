
export function alwaysTrue(): boolean { return true };
export function posNum(num: number, int?: boolean): boolean {
    return !isNaN(num) && num > 0 && (!int || Math.ceil(num) === num);
}
export function posInt(num: number): boolean {
    return posNum(num, true);
}
export function negNum(num: number, int?: boolean): boolean {
    return !isNaN(num) && num < 0 && (!int || Math.ceil(num) === num);
}
export function nonNegNum(num: number, int?: boolean): boolean {
    return !isNaN(num) && num >= 0 && (!int || Math.ceil(num) === num);
}
export function nonPosNum(num: number, int?: boolean): boolean {
    return !isNaN(num) && num <= 0 && (!int || Math.ceil(num) === num);
}
export function nonEmptyStr(str: string): boolean { return str.trim().length > 0; }
export function isInt(num: number): boolean {
    return Math.ceil(num) === num;
}
export function isNum(input: any): input is number {
    return typeof input === 'number';
}
export function isObj(input: any): input is Object {
    return typeof input === 'object';
}
export function isStr(input: any): input is string {
    return typeof input === 'string';
}
export function isBool(input: any): input is boolean {
    return typeof input === 'boolean';
}
export function isDate(input: any): input is Date {
    return input instanceof Date;
}
export function valueStr(input: any) {
    return isStr(input) && input.trim().length === input.length && input.length > 0;
}
