
import * as dps from 'datapvd';
import * as co from 'co';
import * as utility from 'utility';

co(function* (): any {
    const dp = yield dps.literal.resolve({ type: 'r.end', pack: '000001.XSHE' });
    const p1 = yield dp.get(dp.minTs);
    console.log(p1);
    const p2 = yield dp.get(dp.maxTs);
    console.log(p2);
    console.log(utility.date.dateTs2DateKey(dp.minTs), utility.date.dateTs2DateKey(dp.maxTs));
})
    .then(() => console.log('done'))
    .catch(err => console.error(err));

process.on('uncaughtException', (err:any) => {
  console.error(err);
});
process.on('unhandledRejection', (err:any) => {
  console.error(err);
});
