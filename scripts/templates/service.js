const { template } = require("../module.js");

/**@param {import("../module").ParseResult} parsed*/
module.exports = (parsed) => /* prettier-ignore */ template`const session = require("./session.js");
const repository = require("./repository.js");

class Service {${template`${parsed.requests?.filter(req=>!req.isDuplicate)?.map(req=>`
    /**@param {import("express").Request} req */
    async ${req.methodName}(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.${req.methodName}(req);
        return result;
    }`)}`}
}

module.exports = new Service();`;
