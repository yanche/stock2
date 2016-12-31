
//检查最新下载的通联数据（2000年开始）和stock1版本的通联+WIND数据是否一致

import * as datasrc from '../datasrc';
import * as mods from '../mods';
import * as bb from 'bluebird';
import * as filestorage from '../filestorage';
import * as config from '../config';
import * as utility from '../utility';
import * as datadef from '../datadef';

datasrc.mine.meta.stock.getNames()
    .then(allstocks => {
        console.log(`check ${allstocks.length} stocks`);
        const errs: string[] = [];
        return mods.roll(allstocks, target => {
            return bb.all([
                datasrc.mine.targetData.get(target),
                filestorage.azure.downloadJson('raw', target + '.json')
            ])
                .then(data => {
                    const newdata = data[0], olddata = data[1];
                    if (newdata.statusCode !== 200) throw `newdata not found for ${target}, ${newdata.statusCode}`;
                    if (olddata.statusCode !== 200) throw `olddata not found for ${target}, ${olddata.statusCode}`;
                    const oldd = <{ [key: string]: datadef.RawDataSlice }>olddata.data;
                    const newmin = newdata.data.minDay, newmax = newdata.data.maxDay;
                    const newmints = utility.date.dateKey2MsTs(newmin), newmaxts = utility.date.dateKey2MsTs(newmax);
                    const newmins = newdata.data.data[newmin].s, newmaxs = newdata.data.data[newmax].s;
                    const oldmindata = oldd[newmints], oldmaxdata = oldd[newmaxts];
                    if (oldmindata == null) throw `olddata not defined for ${target}, ${newmin}`;
                    if (oldmaxdata == null) throw `olddata not defined for ${target}, ${newmax}`;
                    if (!utility.num.numDiffLessThan(newmaxs / newmins, oldmaxdata.s / oldmindata.s, 0.001)) throw `${target} olddata/newdata ratio: ${(oldmaxdata.s / oldmindata.s) / (newmaxs / newmins)}`;
                })
                .catch(err => {
                    console.log(err);
                    if (typeof err === 'string') errs.push(err);
                    else errs.push(err.stack);
                })
        }, Math.min(allstocks.length, 20))
            .then(() => {
                for (let e of errs) console.log(e);
            });
    })
    .then(() => console.log('done'));
