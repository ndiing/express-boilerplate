const service = require("./service.js");

class Controller {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async postPosts(req, res) {
        const result = await service.postPosts(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async getPostsId(req, res) {
        const result = await service.getPostsId(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async getPosts(req, res) {
        const result = await service.getPosts(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async patchPostsId(req, res) {
        const result = await service.patchPostsId(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async putPostsId(req, res) {
        const result = await service.putPostsId(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async deletePostsId(req, res) {
        const result = await service.deletePostsId(req);
        res.json(result);
    }

    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    async getPostsIdComments(req, res) {
        const result = await service.getPostsIdComments(req);
        res.json(result);
    }
}

module.exports = new Controller();
