
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';
import * as dclient from '../../dclient';
import * as datapvd from '../../../datapvd';

export interface LastEndInput {
    target: string;
}

export interface LastEndOutput {
    lastDts: number;
    lastEnd: number;
    lastEndUpdateTs: number;
}

export const action = new Action<LastEndInput, LastEndInput, LastEndOutput>({
    refine: utility.id,
    validate: (input: LastEndInput): boolean => {
        return utility.validate.valueStr(input.target);
    },
    resolve: (input: LastEndInput): bb<LastEndOutput> => {
        return datapvd.literal.resolve({ type: 'r.end', pack: input.target })
            .then(pvd => {
                if (pvd.hasDef(pvd.maxTs)) {
                    const ret = {
                        lastDts: pvd.maxTs,
                        lastEnd: pvd.get(pvd.maxTs),
                        lastEndUpdateTs: new Date().getTime()
                    };
                    return dclient.rtprice.upsert({ _id: input.target }, { $set: ret })
                        .then(() => ret);
                }
                else return null;
            })
    }
});
