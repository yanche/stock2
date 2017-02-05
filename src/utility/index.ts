
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
import * as meta from './metaobj';

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

export function whileLoop(condition: () => bb<boolean>, body: () => bb<any>): bb<void> {
    return condition()
        .then(loop => {
            if (loop) return body().then(() => whileLoop(condition, body));
            else return;
        });
}

export { validate, date, array, file, http, mongo, num, hypo, prog, meta }
