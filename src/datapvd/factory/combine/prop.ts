
import IFactory from '../fac';
import * as def from '../../def';
import * as utility from '../../../utility';
import * as facutil from '../facutil';
import * as bb from 'bluebird';

interface PropFacPack extends facutil.TransformPackBase<any> {
    prop: string
}

const propFac: IFactory<PropFacPack, any> = facutil.dpTransform<PropFacPack, any, any>({
    prefix: 'PROP',
    inputlist: [{ name: 'prop', validate: utility.validate.valueStr }],
    gen: (pack: PropFacPack, dp: def.DataPvd<any>, ts: number): any => {
        return dp.get(ts)[pack.prop];
    },
    genrtprog: (pack: PropFacPack, dp: def.DataPvd<any>) => {
        return utility.prog.genProg('ref', dp.getRTProg(), pack.prop);
    }
});

export default propFac;
