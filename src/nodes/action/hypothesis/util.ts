
import * as config from '../../../config';

const staticheaders = [
    'target',
    'start',
    'end',
    'days',
    'rev',
    'hday',
    'hdays',
    'hrev',
    'lday',
    'ldays',
    'lrev'
].concat(config.maintainIdx);

export function reportHeaders(params: { [key: string]: any } | Array<string>, envdefs: { [key: string]: any } | Array<string>) {
    const ret = staticheaders.slice(0);
    if (Array.isArray(params))
        for (let q = 0; q < params.length; ++q) ret.push(params[q]);
    else
        for (let i in params) ret.push(`key_${i}`);
    if (Array.isArray(envdefs))
        for (let q = 0; q < envdefs.length; ++q) ret.push(`env_${envdefs[q]}`);
    else
        for (let i in envdefs) ret.push(`env_${i}`);
    return ret.join(',');
}
