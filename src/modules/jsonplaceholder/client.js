const BaseClient = require("../../core/client.js");

class Client extends BaseClient {
    baseURL = "https://jsonplaceholder.typicode.com";
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
    };

    // /**@param {import("express").Request} req */
    // async postPosts(req) {
    //     const resource = "/posts";
    //     /**@type {import("@ndiinginc/fetch").Options}*/
    //     const options = {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    //         },
    //         body: new URLSearchParams([
    //             [
    //                 req?.body?.[0]?.[0], // "title",
    //                 req?.body?.[0]?.[1], // "foo"
    //             ],
    //             [
    //                 req?.body?.[1]?.[0], // "body",
    //                 req?.body?.[1]?.[1], // "bar"
    //             ],
    //             [
    //                 req?.body?.[2]?.[0], // "userId",
    //                 req?.body?.[2]?.[1], // "1"
    //             ],
    //         ]).toString(),
    //     };
    //     const response = await this.fetch(resource, options);
    //     const json = await response.json();
    //     return json;
    // }

    /**@param {import("express").Request} req */
    async postPosts(req) {
        const resource = "/posts";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                title: req?.body?.title, // "foo",
                body: req?.body?.body, // "bar",
                userId: req?.body?.userId, // 1
            }),
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    // /**@param {import("express").Request} req */
    // async postPosts(req) {
    //     const resource = "/posts";
    //
    //     const formData = new FormData();
    //
    //     formData.append("title", req?.body?.title); // "foo"
    //     formData.append("body", req?.body?.body); // "bar"
    //     formData.append("userId", req?.body?.userId); // "1"
    //
    //     /**@type {import("@ndiinginc/fetch").Options}*/
    //     const options = {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundarypWkUVRLeyG4CBXUe"
    //         },
    //         body: formData,
    //     };
    //     const response = await this.fetch(resource, options);
    //     const json = await response.json();
    //     return json;
    // }

    /**@param {import("express").Request} req */
    async getPostsId(req) {
        const resource = "/posts/:id";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {
                id: req?.params?.id, // "1"
            },
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    /**@param {import("express").Request} req */
    async getPosts(req) {
        const resource = "/posts";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {};
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    /**@param {import("express").Request} req */
    async patchPostsId(req) {
        const resource = "/posts/:id";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {
                id: req?.params?.id, // "1"
            },
            method: "PATCH",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                title: req?.body?.title, // "foo"
            }),
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    /**@param {import("express").Request} req */
    async putPostsId(req) {
        const resource = "/posts/:id";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {
                id: req?.params?.id, // "1"
            },
            method: "PUT",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                id: req?.body?.id, // 1,
                title: req?.body?.title, // "foo",
                body: req?.body?.body, // "bar",
                userId: req?.body?.userId, // 1
            }),
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    /**@param {import("express").Request} req */
    async deletePostsId(req) {
        const resource = "/posts/:id";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {
                id: req?.params?.id, // "1"
            },
            method: "DELETE",
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }

    // /**@param {import("express").Request} req */
    // async getPosts(req) {
    //     const resource = "/posts";
    //     /**@type {import("@ndiinginc/fetch").Options}*/
    //     const options = {
    //         query: {
    //             "userId": req?.query?.userId, // "1"
    //         },
    //     };
    //     const response = await this.fetch(resource, options);
    //     const json = await response.json();
    //     return json;
    // }

    /**@param {import("express").Request} req */
    async getPostsIdComments(req) {
        const resource = "/posts/:id/comments";
        /**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
            params: {
                id: req?.params?.id, // "1"
            },
        };
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }
}

module.exports = Client;
