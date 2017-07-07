
import * as log from "../../log";
import * as config from "../../config";
import * as datapvd from "../../datapvd";
import * as action from "../action";
import { def, Consumer } from "lavria";

let sigint = false, working = false;

//limit is a mongo filter
export function init(limit?: Object) {
    process.on("SIGINT", function () {
        if (!sigint) {
            sigint = true;
            consumer.stop()
                .catch((err: Error) => {
                    console.error(`got error when trying to stop consumer, will stop anyway: ${err.message}`);
                    console.error(err.stack);
                })
                .then(() => process.exit(0));
        }
        log.info("will end process after consumer finish the execution of current task and exit");
    });
    const consumer = new Consumer(config.dispatcherHost, config.dispatcherPort, () => {
        const cachedT = datapvd.cachedTargets();
        return Promise.resolve({
            limit: limit,
            preference: cachedT.length === 0 ? [] : [{ "locality.target": { $in: cachedT } }]
        });
    }, (act: def.Action, task: def.Task) => {
        return Promise.resolve().then(() => action.resolve(act, task));
    });
    consumer.start();
}
