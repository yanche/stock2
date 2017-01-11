
//HERE DEFINES A PROGRAM IN JSON FORMAT AND HOW TO EVALUATE IT

import * as utility from './index';

export interface Prog {
    fn: string;
    args: Array<any>;
}

export class Env {
    private _lookup: Map<string, any>;
    private _parent: Env;

    public ref(name: string): any {
        if (this._lookup.has(name)) return this._lookup.get(name);
        else if (this._parent) return this._parent.ref(name);
        else throw new Error(`constiable ${name} not defined`);
    }

    public set(name: string, val: any): this {
        this._lookup.set(name, val);
        return this;
    }

    public setMul(map: Map<string, any>): this {
        for (let i of map) {
            this.set(i[0], i[1]);
        }
        return this;
    }

    constructor(parent?: Env) {
        this._lookup = new Map<string, any>();
        this._parent = parent || null;
    }
}

function isProg(p: any): p is Prog {
    return utility.validate.isObj(p) && p.__val !== true;
}

//here prog could be a Prog, or number/string/boolean/Object
export function evaluate(prog: any, env: Env): any {
    if (!isProg(prog)) {
        if (Array.isArray(prog))
            return prog.map(p => {
                const newenv = new Env(env);
                return evaluate(p, newenv);
            });
        else return prog;
    }
    switch (prog.fn) {
        case 'ref': return env.ref(evaluate(prog.args[0], env));
        case 'prop': return evaluate(prog.args[0], env)[evaluate(prog.args[1], env)];
        case '+':
        case 'add':
            return utility.array.sum2(prog.args.map(a => expectNum(a, env)));
        case '-':
        case 'sub':
            return utility.array.sub2(prog.args.map(a => expectNum(a, env)));
        case '*':
        case 'mul':
            return utility.array.mul2(prog.args.map(a => expectNum(a, env)));
        case '/':
        case 'div':
            return utility.array.div2(prog.args.map(a => expectNum(a, env)));
        case '^':
        case 'pow':
            return Math.pow(expectNum(prog.args[0], env), expectNum(prog.args[1], env));
        case 'if':
            if (evaluate(prog.args[0], env)) return evaluate(prog.args[1], env);
            else return evaluate(prog.args[2], env);
        case '<':
        case 'lt': {
            const v1 = evaluate(prog.args[0], env), v2 = evaluate(prog.args[1], env)
            return utility.validate.isNum(v1) && utility.validate.isNum(v2) && v1 < v2;
        }
        case '>':
        case 'gt': {
            const v1 = evaluate(prog.args[0], env), v2 = evaluate(prog.args[1], env)
            return utility.validate.isNum(v1) && utility.validate.isNum(v2) && v1 > v2;
        }
        case '<=':
        case 'lte': {
            const v1 = evaluate(prog.args[0], env), v2 = evaluate(prog.args[1], env)
            return utility.validate.isNum(v1) && utility.validate.isNum(v2) && v1 <= v2;
        }
        case '>=':
        case 'gte': {
            const v1 = evaluate(prog.args[0], env), v2 = evaluate(prog.args[1], env)
            return utility.validate.isNum(v1) && utility.validate.isNum(v2) && v1 >= v2;
        }
        case '=':
        case 'eq': {
            const f = evaluate(prog.args[0], env);
            for (let i = 1; i < prog.args.length; ++i) {
                if (f !== evaluate(prog.args[i], env))
                    return false;
            }
            return true;
        }
        case 'max': return Math.max.apply(Math, prog.args.map(a => expectNum(a, env)));
        case 'min': return Math.min.apply(Math, prog.args.map(a => expectNum(a, env)));
        case 'abs': return Math.abs(expectNum(prog.args[0], env));
        case 'and':
        case 'every': return prog.args.every(a => Boolean(evaluate(a, env)));
        case 'or':
        case 'some': return prog.args.some(a => Boolean(evaluate(a, env)));
        case 'not': return !Boolean(evaluate(prog.args[0], env));
        case 'begin': {
            const newenv = new Env(env);
            let ret: any = null;
            for (let p of prog.args) ret = evaluate(p, newenv);
            //return last one
            return ret;
        }
        case 'def': {
            const key = expectStr(prog.args[0], env), val = evaluate(prog.args[1], env);
            env.set(key, val);
            return val;
        }
        case 'obj': {
            const a = prog.args[0], ret: { [key: string]: any } = { __val: true };
            if (!utility.validate.isObj(a)) throw new Error(`first arg of "obj" fn must be an object: ${a}`);
            for (let i in a) {
                ret[i] = evaluate(a[i], env);
            }
            return ret;
        }
        case 'contains': {
            const item = evaluate(prog.args[0], env);
            const arr = evaluate(prog.args[1], env);
            if (!Array.isArray(arr)) throw new Error(`second arg of "contains" must be an array: ${arr}`);
            return arr.some(i => i === item);
        }
        case 'between': {
            const v = evaluate(prog.args[0], env);
            const min = evaluate(prog.args[1], env);
            const max = evaluate(prog.args[2], env);
            return utility.validate.isNum(v) && utility.validate.isNum(min) && utility.validate.isNum(max) && min <= v && v <= max;
        }
        case 'count': {
            const arr = evaluate(prog.args[0], env);
            if (!Array.isArray(arr)) throw new Error(`first arg of "count" must be an array: ${arr}`);
            const prg = prog.args[1]; //second parameter is a prog node
            if (prg == null) return arr.length;
            return arr.filter((a, idx) => {
                const newEnv = new Env(env);
                newEnv.set('_item', a);
                newEnv.set('_idx', idx);
                return evaluate(prg, newEnv) === true;
            }).length;
        }
        case 'filter': {
            const arr = evaluate(prog.args[0], env);
            if (!Array.isArray(arr)) throw new Error(`first arg of "filter" must be an array: ${arr}`);
            const prg = prog.args[1]; //second parameter is a prog node
            return arr.filter((a, idx) => {
                const newEnv = new Env(env);
                newEnv.set('_item', a);
                newEnv.set('_idx', idx);
                return evaluate(prg, newEnv) === true;
            });
        }
        case 'map': {
            const arr = evaluate(prog.args[0], env);
            if (!Array.isArray(arr)) throw new Error(`first arg of "map" must be an array: ${arr}`);
            const prg = prog.args[1]; //second parameter is a prog node
            return arr.map((a, idx) => {
                const newEnv = new Env(env);
                newEnv.set('_item', a);
                newEnv.set('_idx', idx);
                return evaluate(prg, newEnv);
            });
        }
        case 'mean': {
            return arrayFn(utility.array.avg2, 'mean', prog, env);
        }
        case 'geo-mean': {
            return arrayFn(utility.array.geoMean2, 'geo-mean', prog, env);
        }
        case 'max': {
            return arrayFn(utility.array.max2, 'max', prog, env);
        }
        case 'min': {
            return arrayFn(utility.array.min2, 'min', prog, env);
        }
        default:
            throw new Error(`undefined function type: ${prog.fn}`);
    }
}

function arrayFn(fn: (arr: Array<number>) => number, name: string, prog: Prog, env: Env) {
    const arr = evaluate(prog.args[0], env);
    if (!Array.isArray(arr)) throw new Error(`first arg of ${name} must be an array: ${arr}`);
    return fn(arr);
}

export function genProg(fn: string, ...args: Array<any>): Prog {
    return { fn: fn, args: args };
}

export function genProg2(fn: string, args: Array<any>): Prog {
    return { fn: fn, args: args };
}

function expectNum(prog: Prog, env: Env): number {
    const e = evaluate(prog, env);
    if (utility.validate.isNum(e)) return e;
    else throw new Error(`got a non-number return when number is expected: ${e}`);
}

function expectStr(prog: Prog, env: Env): string {
    const e = evaluate(prog, env);
    if (utility.validate.isStr(e)) return e;
    else throw new Error(`got a non-string return when string is expected: ${e}`);
}
