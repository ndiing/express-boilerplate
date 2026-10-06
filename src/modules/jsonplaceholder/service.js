const session = require("./session.js");
const repository = require("./repository.js");

class Service {
    /**@param {import("express").Request} req */
    async postPosts(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.postPosts(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async getPostsId(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.getPostsId(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async getPosts(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.getPosts(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async patchPostsId(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.patchPostsId(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async putPostsId(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.putPostsId(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async deletePostsId(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.deletePostsId(req);
        return result;
    }

    /**@param {import("express").Request} req */
    async getPostsIdComments(req) {
        /**@type {import('./client.js')}*/
        const client = session.get(req.params.sessionId);
        const result = await client.getPostsIdComments(req);
        return result;
    }
}

module.exports = new Service();
