
import * as def from '../def';
import * as bb from 'bluebird';

interface IFactory<P, T> {
    make(pack: P): bb<def.DataPvd<T>>;
    dpid(pack: P): string;
    validate(pack: P): boolean;
    weakDepts(pack: P): Array<string>;
}

export default IFactory;
