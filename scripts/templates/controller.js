const { template } = require("../module.js");

/**@param {import("../module").ParseResult} parsed*/
module.exports = (parsed) => /* prettier-ignore */ template`const service = require("./service.js");

class Controller {${template`${parsed.requests?.filter(req=>!req.isDuplicate)?.map(req=>`
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    async ${req.methodName}(req, res) {
        const result = await service.${req.methodName}(req);
        res.json(result);
    }`)}`}
}

module.exports = new Controller();`;
