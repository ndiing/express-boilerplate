const fetch = require("@ndiinginc/fetch");

class Client {
    /**@type {import('@ndiinginc/cookie')}*/
    cookie = null;
    /**@type {import('@ndiinginc/store')}*/
    store = null;
    baseURL;
    headers = {};

    /**
     * @param {import('@ndiinginc/cookie')} cookie
     * @param {import('@ndiinginc/store')} store
     */
    constructor(cookie, store) {
        this.cookie = cookie;
        this.store = store;
    }

    /**
     * @param {String|URL} resource
     * @param {import('@ndiinginc/fetch').Options} options
     * @returns {Promise}
     */
    fetch(resource, options = {}) {
        options = {
            baseURL: this.baseURL,
            beforeRequest: (resource, options) => this.beforeRequest(resource, options),
            beforeResponse: (response) => this.beforeResponse(response),
            ...options,
            cookie: this.cookie,
            headers: {
                ...this.headers,
                ...options.headers,
            },
        };

        return fetch(resource, options);
    }

    /**
     * @param {String|URL} resource
     * @param {import('@ndiinginc/fetch').Options} options
     * @returns {Promise}
     */
    beforeRequest(resource, options) {
        return { resource, options };
    }

    /**
     * @param {import('undici-types').Response} response
     * @returns {Promise}
     */
    beforeResponse(response) {
        return response;
    }
}

module.exports = Client;
