
import * as bb from 'bluebird';

// Ti: type of raw input
// Tr: type of refined input, for resolve/validate
// To: type of return format of resolve
export default class Action<Ti, Tr, To> {
    private _refine: (raw: Ti) => Tr;
    private _validate: (pack: Tr) => boolean;
    private _resolve: (pack: Tr) => bb<To>;

    public validate(raw: Ti): boolean {
        const d = this._refine(raw);
        return this._validate(d);
    }

    public resolve(raw: Ti): bb<To> {
        return bb.resolve()
            .then(() => {
                const d = this._refine(raw);
                if (this._validate(d)) return this._resolve(d);
                else throw new Error('validation fail for input pack');
            });
    }

    constructor(options: {
        refine: (raw: Ti) => Tr,
        validate: (pack: Tr) => boolean,
        resolve: (pack: Tr) => bb<To>
    }) {
        this._refine = options.refine;
        this._validate = options.validate;
        this._resolve = options.resolve;
    }
}
