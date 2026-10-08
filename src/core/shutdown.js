const { beforeShutdown } = require("./before-shutdown.js");

let isShutingDown = false;

/**
 * @param {import('http').Server} server
 * @param {*} signal
 */
async function shutdown(server, signal) {
    if (isShutingDown) return;
    isShutingDown = true;

    console.log("Shutdown", signal);

    const forceShutdown = setTimeout(() => {
        console.log("Force Shutdown");

        process.exit(1);
    }, 30000);
    forceShutdown.unref();

    try {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });

        await beforeShutdown();

        clearTimeout(forceShutdown);

        console.log("Shutdown");

        process.exit(0);
    } catch (error) {
        console.log("Shutdown", error);

        process.exit(1);
    }
}
exports.shutdown = shutdown;
