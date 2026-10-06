const Cookie = require("@ndiinginc/cookie");
const Store = require("@ndiinginc/store");

class Session {
    apiId = null;
    db = null;
    /**@type {Client[]}*/
    clients = new Map();

    constructor(apiId, db, Client) {
        this.apiId = apiId;
        this.db = db;
        this.Client = Client;
    }

    /**
     * @param {String} sessionId
     * @returns {Client}
     */
    get(sessionId) {
        if (!this.clients.has(sessionId)) {
            const options = {
                apiId: this.apiId,
                sessionId,
            };

            const cookie = new Cookie(this.db, options);
            const store = new Store(this.db, options);

            const client = new this.Client(cookie, store);

            this.clients.set(sessionId, client);
        }

        return this.clients.get(sessionId);
    }

    close(sessionId) {
        this.clients.delete(sessionId);
    }

    closeAll() {
        this.clients.clear();
    }
}

module.exports = Session;
