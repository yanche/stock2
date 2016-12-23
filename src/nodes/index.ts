
import * as d from './dispatcher';
import * as p from './producer';
import * as config from '../config';

const t = process.argv[2];
switch (t) {
    case 'd': d.init(config.dispatcherPort);
        break;
    case 'p': p.init(config.producerPort);
        break;
    default:
        throw new Error('unknown type: ' + t);
}
