
import * as datasrc from '../datasrc';
import * as datadef from '../datadef';
import * as config from '../config';
import roll from "croll";
import * as utility from '../utility';
import * as path from 'path';
import * as bb from 'bluebird';

const inputDir = 'D:\\stock raw data\\raw json priceadj=b wmcloud';
const outputDir = 'D:\\stock raw data2\\raw json priceadj=b wmcloud';

datasrc.mine.meta.stock.getNames()
    .then(data => data.map(t => { return { target: t, index: false }; }).concat(config.maintainIdx.map(t => { return { target: t, index: true }; })))
    .then(list => {
        const errs: Array<any> = [];
        return roll(list, item => {
            console.log(`now processing: ${item.target}`);
            return Promise.resolve()
                .then(() => utility.file.loadJsonFile<{ [key: string]: RawOld }>(path.join(inputDir, `${item.target}.json`)))
                .then(data => {
                    let minDts: number = null, maxDts: number = null, ret: datadef.RawData = { data: {}, minDay: null, maxDay: null };
                    for (let ts in data) {
                        if (ts !== 'minTs' && ts !== 'maxTs') {
                            const d = data[ts];
                            if (Number(ts) !== d.ts) throw new Error(`validation: ts mismatch: ${ts}, ${d.ts}`);
                            const dts = utility.date.msTs2DateTs(d.ts);
                            if (!utility.validate.posInt(dts)) throw new Error(`validation, dts: ${dts}, ${d.ts}`);
                            if (minDts == null || dts < minDts) minDts = dts;
                            if (maxDts == null || dts > maxDts) maxDts = dts;
                            if (item.index) {
                                ret.data[utility.date.dateTs2DateKey(dts)] = {
                                    s: d.s,
                                    e: d.e,
                                    h: d.h,
                                    l: d.l,
                                    v: d.v
                                }
                            }
                            else {
                                ret.data[utility.date.dateTs2DateKey(dts)] = {
                                    s: d.s,
                                    e: d.e,
                                    h: d.h,
                                    l: d.l,
                                    ex: d.ex,
                                    v: d.v,
                                    mv: d.mv,
                                    nr: d.nr
                                }
                            }
                        }
                    }
                    if (minDts == null || maxDts == null) throw new Error('no data');
                    ret.maxDay = utility.date.dateTs2DateKey(maxDts);
                    ret.minDay = utility.date.dateTs2DateKey(minDts);
                    return utility.file.writeFile(path.join(outputDir, `${item.target}.json`), JSON.stringify(ret));
                })
                .catch(err => errs.push(err));
        }, Math.min(10, list.length))
            .then(() => {
                for (let e of errs) console.error(e);
            });
    })
    .then(() => console.log('done'))
    .catch(err => console.error(err.stack));

interface RawOld {
    ts: number;
    s: number;
    e: number;
    h: number;
    l: number;
    ex: number;
    v: number;
    mv: number;
    nr: number;
}
