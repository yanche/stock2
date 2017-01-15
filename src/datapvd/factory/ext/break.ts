
//高点回撤 低点反弹

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as bb from 'bluebird';

const genProg = utility.prog.genProg;

interface BreakFacPack {
    dpUp: literal.LiteralDP | def.DataPvd<any>,
    dpDown: literal.LiteralDP | def.DataPvd<any>,
    defByUp: boolean,
}

function dpid(pack: BreakFacPack): string { return `BREAK_${literal.dpid(pack.dpUp)}_${literal.dpid(pack.dpDown)}`; }

const breakFac: IFactory<BreakFacPack, boolean> = {
    make: (pack: BreakFacPack) => {
        return bb.all([
            literal.resolve(pack.dpUp),
            literal.resolve(pack.dpDown)
        ])
            .then(data => {
                const dpUp: def.DataPvd<number> = data[0], dpDown: def.DataPvd<number> = data[1];
                const defdp = pack.defByUp ? dpUp : dpDown;
                return new def.DataPvd<boolean>({
                    id: dpid(pack),
                    maxTs: defdp.maxTs,
                    minTs: defdp.minTs,
                    hasdef: defdp.hasDef_core,
                    hasdefprog: defdp.hasDefProg_core,
                    gen: (dts: number) => {
                        const bdts = defdp.backwardTs(dts, 1);
                        const curUp = dpUp.get(dts), curDown = dpDown.get(dts);
                        const prevUp = dpUp.get(bdts), prevDown = dpDown.get(bdts);
                        return curUp > curDown && prevUp <= prevDown;
                    },
                    genrtprog: () => {
                        const prevUp = dpUp.get(defdp.maxTs), prevDown = dpDown.get(defdp.maxTs);
                        if (prevUp <= prevDown) return utility.prog.genProg('>', dpUp.getRTProg(), dpDown.getRTProg());
                        else return false;
                    },
                    remoteTs: defdp.remoteTs_core,
                    weakdepts: defdp.weakdepts
                });
            });
    },
    validate: (pack: BreakFacPack) => literal.validate(pack.dpDown) && literal.validate(pack.dpUp) && utility.validate.isBool(pack.defByUp),
    dpid: dpid,
    weakDepts: (pack: BreakFacPack) => literal.weakDepts(pack.defByUp ? pack.dpUp : pack.dpDown)
};

export default breakFac;
