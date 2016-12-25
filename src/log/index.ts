

export function debug(msg: string) {
    console.debug(msg);
}

export function info(msg: string) {
    console.info(msg);
}

export function error(msg: string) {
    console.error(msg);
}

export function warn(msg: string) {
    console.warn(msg);
}

process.on('unhandledRejection', (reason: any, p: Promise<any>) => {
    error(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`);
});

process.on('uncaughtException', (err: any) => {
  error(`Caught exception: ${err}`);
});
