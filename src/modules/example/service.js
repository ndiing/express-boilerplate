const session = require("./session.js");
const repository = require("./repository.js");

// repository.create({name:'test'}).then(console.log)
// repository.getAll().then(console.log)

class Service {
    /**@param {import("express").Request} req */
    async get(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.get(req);
        return result;
    }
}

module.exports = new Service();
