
//止损 止盈

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as constants from '../../../const';

const genProg = utility.prog.genProg;

interface StoplossFacPack {
    rate: number;
    target: string;
}

function dpid(pack: StoplossFacPack): string { return `STOPLOSS_${pack.rate}_${pack.target}`; }

const stoplossFac: IFactory<StoplossFacPack, boolean> = {
    make: (pack: StoplossFacPack) => {
        return literal.resolve({ type: constants.dpType.raw.end, pack: pack.target })
            .then((epvd: def.DataPvd<number>) => {
                return new def.DataPvd<boolean>({
                    id: dpid(pack),
                    maxTs: epvd.maxTs,
                    minTs: epvd.minTs,
                    hasdef: epvd.hasDef_core,
                    gen: (dts: number, ctx: def.DataGetterCtx) => {
                        if (ctx == null) return false;
                        const e = epvd.get(dts);
                        if (pack.rate < 1) return e <= ctx.sp * pack.rate;
                        else return e >= ctx.sp * pack.rate;
                    },
                    genrtprog: () => {
                        return genProg(pack.rate < 1 ? '<=' : '>=',
                            epvd.getRTProg(),
                            genProg(
                                'mul',
                                genProg(
                                    'prop',
                                    genProg('ref', 'ctx'),
                                    'sp'),
                                pack.rate)
                        );
                    },
                    remoteTs: epvd.remoteTs_core,
                    weakdepts: epvd.weakdepts
                });
            });
    },
    validate: (pack: StoplossFacPack) => utility.validate.valueStr(pack.target) && utility.validate.posNum(pack.rate) && pack.rate !== 1,
    dpid: dpid,
    weakDepts: (pack: StoplossFacPack) => [pack.target]
};

export default stoplossFac;
