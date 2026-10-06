const fs = require("fs");
const path = require("node:path");

function loadModules(app) {
    const dir = path.resolve("src", "modules");
    for (const name of fs.readdirSync(dir)) {
        const module = require(path.join(dir, name));
        app.use(module.path, module.router);
    }
}
exports.loadModules = loadModules;
