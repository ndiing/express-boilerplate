const PORT = process.env.PORT || 3000;

const os = require("os");
const { beforeStart } = require("./before-start.js");

async function start(server) {
    try {
        await beforeStart();

        await new Promise((resolve, reject) => {
            server.on("error", reject);
            server.listen(PORT, resolve);
        });

        console.log("Start");

        const { port } = server.address();

        const interfaces = os.networkInterfaces();
        for (const name in interfaces) {
            for (const interface of interfaces[name]) {
                if (interface.family !== "IPv4") continue;
                console.log(`http://${interface.address}:${port}`);
            }
        }
    } catch (error) {
        console.log("Start", error);

        process.exit(1);
    }
}
exports.start = start;
