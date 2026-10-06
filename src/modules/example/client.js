const BaseClient = require("../../core/client.js");

class Client extends BaseClient {
    baseURL = "https://jsonplaceholder.typicode.com";
    headers = {};

    /**@param {import("express").Request} req */
    async get(req) {
        const resource = "/posts/1";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {},
            query: {},
            method: "GET",
            headers: {},
            body: undefined,
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }
}

module.exports = Client;
