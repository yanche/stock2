
//某只股票N天内一共有几个上证的交易日（用于看停牌时间）

import IFactory from '../fac';
import * as facutil from '../facutil';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as constants from '../../../const';
import * as literal from '../../literal';
import * as bb from 'bluebird';

const genProg = utility.prog.genProg;

interface MarketDaysFacPack {
    target: string;
    N: number;
}

function dpid(pack: MarketDaysFacPack): string { return `MKTDAYS_${pack.target}_${pack.N}`; }

const mktDaysFac: IFactory<MarketDaysFacPack, number> = {
    make: (pack: MarketDaysFacPack) => {
        return bb.all([
            literal.resolve({ type: constants.dpType.raw.end, pack: pack.target }),
            literal.resolve({ type: constants.dpType.raw.end, pack: '000001.ZICN' })
        ])
            .then(data => {
                const dp: def.DataPvd<number> = data[0], dpsh: def.DataPvd<number> = data[1];
                return new def.DataPvd<number>({
                    id: dpid(pack),
                    maxTs: dp.maxTs,
                    minTs: dp.forwardTs(dp.minTs, pack.N - 1) || facutil.dateTsOffset(dp.maxTs, 1),
                    hasdef: dp.hasDef_core,
                    hasdefprog: dp.hasDefProg_core,
                    gen: (dts: number) => {
                        if (pack.N === 1) return 1;
                        const bts = dp.backwardTs(dts, pack.N - 1);
                        return dpsh.periodTs(bts, dts).length;
                    },
                    genrtprog: () => {
                        if (pack.N === 1) return 1;
                        else {
                            const bts1 = dp.backwardTs(dp.maxTs, pack.N - 2);
                            const days = dpsh.periodTs(bts1, dpsh.maxTs).length;
                            return days + 1;
                        }
                    },
                    remoteTs: dp.remoteTs_core,
                    weakdepts: [pack.target]
                });
            });
    },
    validate: (pack: MarketDaysFacPack) => utility.validate.valueStr(pack.target) && utility.validate.posInt(pack.N),
    dpid: dpid,
    weakDepts: (pack: MarketDaysFacPack) => [pack.target]
};

export default mktDaysFac;
