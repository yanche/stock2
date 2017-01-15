
//最少持有N个自然日

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as constants from '../../../const';
import * as bb from 'bluebird';

const genProg = utility.prog.genProg;

function dpid(N: number): string { return `NDAYS_${N}`; }

const ndaysFac: IFactory<number, boolean> = {
    make: (N: number) => {
        return bb.resolve(new def.DataPvd<boolean>({
            id: dpid(N),
            maxTs: utility.date.dateTs(2100, 0, 1),
            minTs: 0,
            hasdef: utility.validate.alwaysTrue,
            hasdefprog: utility.validate.alwaysTrue,
            gen: (dts: number, ctx: def.DataGetterCtx) => {
                if (ctx == null) return false;
                return dts >= ctx.sdts + N;
            },
            genrtprog: () => {
                return genProg('lte',
                    genProg('prop', genProg('ref', constants.rtProgRef.ctx), constants.rtProgCtxProps.sdts),
                    genProg('sub', genProg('ref', constants.rtProgRef.curDts), N),
                );
            },
            remoteTs: (ts: number, n: number) => ts + n,
            weakdepts: []
        }));
    },
    validate: (N: number) => utility.validate.posInt(N),
    dpid: dpid,
    weakDepts: (N: number) => []
};

export default ndaysFac;
