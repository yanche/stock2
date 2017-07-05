
import * as inspector from './inspector';
import * as config from '../../config';
import { Dispatcher } from "lavria";

export function init(port: number) {
    const dispatcher = new Dispatcher(config.dispatcherPort, config.dispatcherMongoUrl);
    dispatcher.start();

    if (config.scheduledTask)
        inspector.jobScheduleCheck();
}
