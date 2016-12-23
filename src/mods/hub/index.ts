
import * as bb from 'bluebird';

interface PendingQueueItem<T> {
    res: (thenableOrResult?: T | bb.Thenable<T>) => void,
    rej: (err?: any) => void
}

export default class Hub<T>{
    private _fn: () => bb<T>;
    private _resolved: boolean;
    private _result: T;
    private _pendingQ: Array<PendingQueueItem<T>>;
    private _timeout: number;
    private _resolvedTs: number;

    constructor(fn: () => bb<T>, timeout?: number) {
        this._fn = fn;
        this._timeout = timeout;
        this._pendingQ = [];
    }

    get(): bb<T> {
        if (this._resolved && !this.timeout()) return bb.resolve(this._result);
        else {
            return new bb<T>((res, rej) => {
                this._pendingQ.push({ res: res, rej: rej });
                if (this._pendingQ.length === 1) {
                    this._resolved = false;
                    this._resolvedTs = null;
                    this._result = null;
                    process.nextTick(() => {
                        this._fn()
                            .then(val => {
                                this._resolved = true;
                                this._resolvedTs = new Date().getTime();
                                this._result = val;
                                for (let x of this._pendingQ) x.res(val);
                                this._pendingQ = [];
                            }, err => {
                                for (let x of this._pendingQ) x.rej(err);
                                this._pendingQ = [];
                            })
                    });
                }
            });
        }
    }
    timeout(): boolean {
        return this._timeout != null && this._resolvedTs != null && (this._timeout + this._resolvedTs <= new Date().getTime());
    }
}
