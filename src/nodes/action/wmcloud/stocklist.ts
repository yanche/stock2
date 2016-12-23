
import * as datasrc from '../../../datasrc';
import * as bb from 'bluebird';
import * as utility from '../../../utility';
import Action from '../action';

export interface StockListOutput {
    allstocks: number;
    allidx: number;
}

export const action = new Action<void, void, StockListOutput>({
    refine: utility.noop,
    validate: utility.validate.alwaysTrue,
    resolve: (): bb<StockListOutput> => {
        return bb.all([datasrc.wm.getAllStocks(), datasrc.wm.getAllIndexes()])
            .then(data => {
                return bb.all([
                    datasrc.mine.meta.stock.upload(data[0]),
                    datasrc.mine.meta.index.upload(data[1]),
                    datasrc.mine.meta.stock.uploadNames(getTargets(data[0])),
                    datasrc.mine.meta.index.uploadNames(getTargets(data[1]))
                ])
                    .then(() => {
                        return {
                            allstocks: data[0].length,
                            allidx: data[1].length
                        };
                    });
            });
    }
});

function getTargets(input: Array<{ target: string }>): Array<string> {
    return input.map(x => x.target);
}
