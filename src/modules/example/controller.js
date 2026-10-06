const service = require("./service.js");

class Controller {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async get(req, res) {
        const result = await service.get(req);
        res.json(result);
    }
}

module.exports = new Controller();
