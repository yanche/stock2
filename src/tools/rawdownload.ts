
import * as datasrc from '../datasrc';
import * as bb from 'bluebird';
import * as config from '../config';
import * as mods from '../mods';
import * as utility from '../utility';
import * as path from 'path';

const dir = process.argv[2];
console.log(`downloaded raw data files will be written to ${dir}`);

bb.all([
    datasrc.mine.meta.stock.getNames(),
    config.maintainIdx
])
    .then(d => {
        console.log(`${d[0].length} stocks, ${d[1].length} indexes`);
        const targets = d[0].concat(d[1]);
        return mods.roll(targets, target => {
            return datasrc.mine.targetData.get(target)
                .then(data => {
                    if (data.statusCode !== 200) throw `raw not found for ${target}, ${data.statusCode}`;
                    return utility.file.writeFile(path.join(dir, `${target}.json`), JSON.stringify(data.data), false);
                })
                .then(() => console.log(`${target} downloaded`))
                .catch(err => {
                    console.error(err);
                })
        }, Math.min(targets.length, 20));
    })
    .then(() => console.log('done'));
