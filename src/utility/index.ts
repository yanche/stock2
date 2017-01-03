
import * as validate from './validate';
import * as date from './date';
import * as array from './array';
import * as file from './file';
import * as http from './http';
import * as mongo from './mongo';
import * as num from './num';
import * as hypo from './hypo';
import * as bb from 'bluebird';
import * as mongodb from 'mongodb';
import * as prog from './prog';

export function parseJson<T>(str: string): T {
    try {
        return <T>JSON.parse(str);
    }
    catch (e) {
        return null;
    }
}

export function toStr(input: any): string {
    return <string>input.toString();
}

export function randomStr() {
    return new mongodb.ObjectID().toHexString();
};

export function noop() { };

export function id<T>(x: T): T { return x; }

function strRef(str: string): string {
    str = str.trim();
    if (str.length < 4) return null;
    else if (str.slice(0, 2) === '{{' && str.slice(-2) === '}}') return str.slice(2, -2);
    else return null;
}

export function refReplace(input: any, map: { [key: string]: any }): any {
    if (validate.isStr(input)) {
        const ref = strRef(input);
        return (ref == null || !(ref in map)) ? input : map[ref];
    }
    else if (Array.isArray(input)) {
        return input.map(o => refReplace(o, map));
    }
    else if (validate.isObj(input)) {
        const ret: { [key: string]: any } = {};
        for (let i in input) {
            ret[i] = refReplace(input[i], map);
        }
        return ret;
    }
    else return input;
}

export function whileLoop(condition: () => bb<boolean>, body: () => bb<any>): bb<void> {
    return condition()
        .then(loop => {
            if (loop) return body().then(() => whileLoop(condition, body));
            else return;
        });
}

export { validate, date, array, file, http, mongo, num, hypo, prog }
