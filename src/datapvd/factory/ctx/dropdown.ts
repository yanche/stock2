
//高点回撤 低点反弹

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as constants from '../../../const';

const genProg = utility.prog.genProg;

interface DropdownFacPack {
    rate: number;
    target: string;
}

function dpid(pack: DropdownFacPack): string { return `DROPDOWN_${pack.rate}_${pack.target}`; }

const dropdownFac: IFactory<DropdownFacPack, boolean> = {
    make: (pack: DropdownFacPack) => {
        return literal.resolve({ type: constants.dpType.raw.end, pack: pack.target })
            .then((epvd: def.DataPvd<number>) => {
                return new def.DataPvd<boolean>({
                    id: dpid(pack),
                    maxTs: epvd.maxTs,
                    minTs: epvd.minTs,
                    hasdef: epvd.hasDef_core,
                    hasdefprog: epvd.hasDefProg_core,
                    gen: (dts: number, ctx: def.DataGetterCtx) => {
                        if (ctx == null) return false;
                        const e = epvd.get(dts);
                        if (pack.rate < 1) return e <= ctx.hp * pack.rate;
                        else return e >= ctx.lp * pack.rate;
                    },
                    genrtprog: () => {
                        return genProg(pack.rate < 1 ? '<=' : '>=',
                            epvd.getRTProg(),
                            genProg(
                                'mul',
                                genProg(
                                    'prop',
                                    genProg('ref', constants.rtProgRef.ctx),
                                    pack.rate < 1 ? constants.rtProgCtxProps.hp : constants.rtProgCtxProps.lp),
                                pack.rate)
                        );
                    },
                    remoteTs: epvd.remoteTs_core,
                    weakdepts: epvd.weakdepts
                });
            });
    },
    validate: (pack: DropdownFacPack) => utility.validate.valueStr(pack.target) && utility.validate.posNum(pack.rate) && pack.rate !== 1,
    dpid: dpid,
    weakDepts: (pack: DropdownFacPack) => [pack.target]
};

export default dropdownFac;
