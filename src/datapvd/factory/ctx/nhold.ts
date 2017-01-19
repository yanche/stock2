
//最少持有N个交易日

import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as literal from '../../literal';
import * as constants from '../../../const';

interface NHoldFacPack {
    N: number;
    target: string;
}

function dpid(pack: NHoldFacPack): string { return `NHOLD_${pack.N}_${pack.target}`; }

const nholdFac: IFactory<NHoldFacPack, boolean> = {
    make: (pack: NHoldFacPack) => {
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
                        const pts = epvd.forwardTs(ctx.sdts, pack.N);
                        return pts != null && pts <= dts;
                    },
                    genrtprog: () => {
                        const sdts = epvd.backwardTs(epvd.maxTs, pack.N - 1);
                        return utility.prog.genProg('lte', utility.prog.genProg('prop', utility.prog.genProg('ref', constants.rtProgRef.ctx), constants.rtProgCtxProps.sdts), sdts);
                    },
                    remoteTs: epvd.remoteTs_core,
                    weakdepts: epvd.weakdepts
                });
            });
    },
    validate: (pack: NHoldFacPack) => utility.validate.valueStr(pack.target) && utility.validate.posInt(pack.N),
    dpid: dpid,
    weakDepts: (pack: NHoldFacPack) => [pack.target]
};

export default nholdFac;
