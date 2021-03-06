
import IFactory from '../fac';
import * as bb from 'bluebird';
import * as def from '../../def';
import * as utility from '../../../utility';

function dpid(num: number): string { return `CONST_${num}`; }

const constFac: IFactory<number, number> = {
    make: (num: number) => {
        return bb.resolve(new def.DataPvd<number>({
            id: dpid(num),
            maxTs: utility.date.dateTs(2100, 0, 1),
            minTs: 0,
            hasdef: utility.validate.alwaysTrue,
            hasdefprog: utility.validate.alwaysTrue,
            gen: () => num,
            genrtprog: () => num,
            remoteTs: (ts: number, n: number) => ts + n,
            weakdepts: []
        }));
    },
    validate: utility.validate.alwaysTrue,
    dpid: dpid,
    weakDepts: () => []
};

export default constFac;
