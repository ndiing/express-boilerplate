## \src\index.js

```js
require("dotenv").config();

const http = require("http");
const { shutdown } = require("./core/shutdown.js");
const { start } = require("./core/start.js");
const { app } = require("./core/app.js");

const server = http.createServer(app);

process.on("uncaughtException", (error) => {
    console.log("Uncaught Exception", error);

    shutdown(server, "uncaughtException");
});
process.on("unhandledRejection", (reason) => {
    console.log("Unhandled Rejection", reason);

    shutdown(server, "unhandledRejection");
});

process.on("SIGTERM", () => shutdown(server, "SIGTERM"));
process.on("SIGINT", () => shutdown(server, "SIGINT"));

start(server);


```
## \tests\example.test.js

```js
const repository = require("../src/modules/example/repository.js");

describe("example", () => {
    test("repository getAll", async () => {
        const result = await repository.getAll();
        expect(!!result.meta).toBe(true);
    });
});


```
## \tests\jsonplaceholder.test.js

```js
const repository = require("../src/modules/jsonplaceholder/repository.js");

describe("jsonplaceholder", () => {
    test("test", async () => {});
});


```
## \src\config\db.js

```js
const Database = require("@ndiinginc/dal");

const db = new Database({
    client: "better-sqlite3",
    connection: {
        database: "./express-boilerplate.db",
    },
    migrations: {
        // directory: "migrations",
        // tableName: "migrations",
    },
});
exports.db = db;

// db.migrate()


```
## \src\core\app-error.js

```js
class AppError extends Error {
    constructor({ status = 500, code = null, message = "Internal Server Error", details = null } = {}) {
        super(message);

        this.status = status;
        this.code = code;
        this.details = details;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;


```
## \src\core\app.js

```js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { notFoundHandler } = require("./not-found-handler.js");
const { errorHandler } = require("./error-handler.js");
const { loadModules } = require("./load-modules.js");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
loadModules(app);
app.use(notFoundHandler());
app.use(errorHandler());
exports.app = app;


```
## \src\core\before-shutdown.js

```js
async function beforeShutdown() {
    console.log("Before Shutdown");
}
exports.beforeShutdown = beforeShutdown;


```
## \src\core\before-start.js

```js
async function beforeStart() {
    console.log("Before Start");
}
exports.beforeStart = beforeStart;


```
## \src\core\client.js

```js
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


```
## \src\core\error-handler.js

```js
function errorHandler() {
    return function (err, req, res, next) {
        res.status(err.status || 500).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                ...(process.env.NODE_ENV === "development" && {
                    stack: err.stack,
                }),
            },
        });
    };
}
exports.errorHandler = errorHandler;


```
## \src\core\load-modules.js

```js
const fs = require("fs");
const path = require("node:path");

function loadModules(app) {
    const dir = path.resolve("src", "modules");
    for (const name of fs.readdirSync(dir)) {
        const module = require(path.join(dir, name));
        app.use(module.path, module.router);
    }
}
exports.loadModules = loadModules;


```
## \src\core\not-found-handler.js

```js
const { AppError } = require("./app-error.js");

function notFoundHandler() {
    return function (req, res, next) {
        const err = new AppError({
            status: 404,
            code: "NOT_FOUND",
            message: "Not Found",
        });
        next(err);
    };
}
exports.notFoundHandler = notFoundHandler;


```
## \src\core\repository.js

```js
const isObject = (any) => toString.call(any) === "[object Object]";
const isArray = (any) => toString.call(any) === "[object Array]";
const isEmpty = (any) => any == null || (typeof any === "string" && any.trim() === "");

/**
 * @typedef Column
 * @property {String} type
 * @property {Boolean} identity
 * @property {Boolean} primary
 * @property {Boolean} nullable
 */

/**
 * @typedef Options
 * @property {String} search
 * @property {Object} filters
 * @property {Object} sorters
 * @property {Number} [page=1]
 * @property {Number} [limit=10]
 */

const OPERATORS = new Set([
    // Comparison
    "=",
    "!=",
    "<>",
    ">",
    "<",
    ">=",
    "<=",

    // Pattern matching
    "LIKE",
    "NOT LIKE",
    "ILIKE",
    "NOT ILIKE", // PG
    "GLOB",
    "NOT GLOB", // SQLite
    "SIMILAR TO",
    "NOT SIMILAR TO", // PG (SQL standard)
    "REGEXP",
    "NOT REGEXP", // MySQL (future)
    "RLIKE",
    "NOT RLIKE", // MySQL (future)

    // Set
    "IN",
    "NOT IN",

    // Range
    "BETWEEN",
    "NOT BETWEEN",

    // Null & Boolean
    "IS",
    "IS NOT",

    // Null-safe (PG)
    "IS DISTINCT FROM",
    "IS NOT DISTINCT FROM",

    // Full-text (PG)
    "@@",
]);

const DIRECTIONS = new Set(["ASC", "DESC"]);

class Repository {
    /**@type {import("@ndiinginc/dal")}*/
    db = null;
    /**@type {String}*/
    table = null;
    /**@type {Object.<String, Column>}*/
    columns = null;
    /**@type {String|Array}*/
    primaryKey = "id";
    /**@type {Array}*/
    searchableColumns = null;
    /**@type {Array}*/
    conflictColumns = null;
    /**@type {String}*/
    softDelete = null;

    /**
     * @param {import("@ndiinginc/dal")} db
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * @param {String|Number|Object} id
     */
    _buildCriteria(id) {
        const criteria = {};
        if (isArray(this.primaryKey)) {
            for (const column of this.primaryKey) {
                criteria[column] = id[column];
            }
        } else {
            criteria[this.primaryKey] = id;
        }

        return criteria;
    }

    /**
     * @param {import("@ndiinginc/dal/types/query")} query
     * @param {Object} criteria
     */
    _applyWhere(query, criteria = {}, softDelete = !!this.softDelete) {
        const filters = { ...criteria };

        if (this.softDelete) {
            filters[this.softDelete] = softDelete ? 0 : 1;
        }

        for (const column in filters) {
            if (!this.columns[column]) {
                throw new Error(`Unknown column "${column}" in filters`);
            }

            const value = filters[column];
            if (isObject(value)) {
                for (const operator in value) {
                    const opr = operator.toUpperCase();
                    if (!OPERATORS.has(opr)) {
                        throw new Error(`Unsupported operator "${opr}" for column "${column}"`);
                    }

                    query.where(column, opr, value[operator]);
                }
            } else {
                query.where(column, value);
            }
        }
    }

    /**
     * @param {import("@ndiinginc/dal/types/query")} query
     * @param {String} search
     */
    _applySearch(query, search) {
        if (isEmpty(search) || !this.searchableColumns?.length) {
            return;
        }

        const value = `%${this.db.escapeLike(String(search).trim())}%`;

        query.where((query) => {
            for (const column of this.searchableColumns) {
                query.orWhere(column, "LIKE", value);
            }
        });
    }

    /**
     * @param {import("@ndiinginc/dal/types/query")} query
     * @param {String} sorters
     */
    _applyOrderBy(query, sorters = {}) {
        for (const column in sorters) {
            if (!this.columns[column]) {
                throw new Error(`Unknown column "${column}" in sorters`);
            }

            const direction = sorters[column]?.toUpperCase();
            if (!DIRECTIONS.has(direction)) {
                throw new Error(`Invalid sort direction "${direction}". Use ASC or DESC`);
            }

            query.orderBy(column, direction);
        }
    }

    /**
     * @param {Object} row
     * @returns {Promise}
     */
    async create(row) {
        if (Array.isArray(row)) {
            throw new Error("create expects a single row, use createMany for arrays");
        }

        const rows = await this.createMany([row]);
        return rows[0] ?? null;
    }

    /**
     * @param {Array} rows
     * @returns {Promise}
     */
    async createMany(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("createMany requires a non-empty array");
        }

        const query = this.db.query();

        return await query.insert(this.table, rows).returning();
    }

    /**
     * @param {Object} row
     * @returns {Promise}
     */
    async upsert(row) {
        if (Array.isArray(row)) {
            throw new Error("upsert expects a single row, use upsertMany for arrays");
        }

        const rows = await this.upsertMany([row]);
        return rows[0] ?? null;
    }

    /**
     * @param {Array} rows
     * @returns {Promise}
     */
    async upsertMany(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("upsertMany requires a non-empty array");
        }
        if (!this.conflictColumns?.length) {
            throw new Error("Upsert requires conflictColumns to be defined");
        }

        const query = this.db.query();

        return await query.insert(this.table, rows).onConflict(this.conflictColumns).doUpdate().returning();
    }

    /**
     * @param {String|Number} id
     * @returns {Promise}
     */
    async get(id) {
        const criteria = this._buildCriteria(id);

        return this.getBy(criteria);
    }

    /**
     * @param {Object} criteria
     * @returns {Promise}
     */
    async getBy(criteria = {}) {
        const query = this.db.query();

        this._applyWhere(query, criteria);

        return await query.select().from(this.table).limit(1).first();
    }

    /**
     * @param {Options} options
     * @returns {{rows: Array, meta: Object}}
     */
    async getAll(options = {}) {
        let { search = "", filters = {}, sorters = {}, page = 1, limit = 10 } = options;

        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.max(1, parseInt(limit, 10) || 10);
        const offset = (page - 1) * limit;

        const query = this.db.query();

        this._applySearch(query, search);
        this._applyWhere(query, filters);
        this._applyOrderBy(query, sorters);

        query.limit(limit + 1);
        query.offset(offset);

        const result = await query.select().from(this.table);

        const rows = result.slice(0, limit);

        return {
            rows,
            meta: {
                page,
                limit,
                offset,
                prev: page > 1,
                next: result.length > limit,
                start: rows.length > 0 ? offset + 1 : 0,
                end: offset + rows.length,
            },
        };
    }

    /**
     * @param {String|Number} id
     * @param {Object} row
     * @returns {Promise}
     */
    async update(id, row) {
        const criteria = this._buildCriteria(id);

        return this.updateBy(criteria, row);
    }

    /**
     * @param {Object} criteria
     * @param {Object} row
     * @returns {Promise}
     */
    async updateBy(criteria = {}, row) {
        const query = this.db.query();

        this._applyWhere(query, criteria);

        return await query.update(this.table, row).returning();
    }

    /**
     * @param {String|Number} id
     * @returns {Promise}
     */
    async restore(id) {
        const criteria = this._buildCriteria(id);

        return this.restoreBy(criteria);
    }

    /**
     * @param {Object} criteria
     * @returns {Promise}
     */
    async restoreBy(criteria = {}) {
        if (!this.softDelete) {
            throw new Error("Restore operation is only available when softDelete is enabled");
        }

        const query = this.db.query();

        this._applyWhere(query, criteria, false);

        return await query
            .update(this.table, {
                [this.softDelete]: 0,
            })
            .returning();
    }

    /**
     * @param {String|Number} id
     * @returns {Promise}
     */
    async delete(id) {
        const criteria = this._buildCriteria(id);

        return this.deleteBy(criteria);
    }

    /**
     * @param {Object} criteria
     * @returns {Promise}
     */
    async deleteBy(criteria = {}) {
        const query = this.db.query();

        this._applyWhere(query, criteria);

        if (!!this.softDelete) {
            return await query
                .update(this.table, {
                    [this.softDelete]: 1,
                })
                .returning();
        }

        return await query.delete(this.table).returning();
    }
}

module.exports = Repository;


```
## \src\core\session.js

```js
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


```
## \src\core\shutdown.js

```js
const { beforeShutdown } = require("./before-shutdown.js");

let isShutingDown = false;

async function shutdown(server, signal) {
    if (isShutingDown) return;
    isShutingDown = true;

    console.log("Shutdown", signal);

    const forceShutdown = setTimeout(() => {
        console.log("Force Shutdown");

        process.exit(1);
    }, 30000);
    forceShutdown.unref();

    try {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });

        await beforeShutdown();

        clearTimeout(forceShutdown);

        console.log("Shutdown");

        process.exit(0);
    } catch (error) {
        console.log("Shutdown", error);

        process.exit(1);
    }
}
exports.shutdown = shutdown;


```
## \src\core\start.js

```js
const PORT = process.env.PORT || 3000;

const os = require("os");
const { beforeStart } = require("./before-start.js");

async function start(server) {
    try {
        await beforeStart();

        await new Promise((resolve, reject) => {
            server.on("error", reject);
            server.listen(PORT, resolve);
        });

        console.log("Start");

        const { port } = server.address();

        const interfaces = os.networkInterfaces();
        for (const name in interfaces) {
            for (const interface of interfaces[name]) {
                if (interface.family !== "IPv4") continue;
                console.log(`http://${interface.address}:${port}`);
            }
        }
    } catch (error) {
        console.log("Start", error);

        process.exit(1);
    }
}
exports.start = start;


```
## \src\modules\example\client.js

```js
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


```
## \src\modules\example\controller.js

```js
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


```
## \src\modules\example\index.js

```js
const express = require("express");
const controller = require("./controller.js");

const router = express.Router();

router.get("/:sessionId", controller.get);

module.exports = {
    path: "/api/example",
    router,
};


```
## \src\modules\example\repository.js

```js
const BaseRepository = require("../../core/repository.js");
const { db } = require("../../config/db.js");

class Repository extends BaseRepository {
    table = "example";
    primaryKey = "id";
    columns = {
        id: {},
        name: {},
    };
}

module.exports = new Repository(db);


```
## \src\modules\example\service.js

```js
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


```
## \src\modules\example\session.js

```js
const path = require("path");
const Client = require("./client.js");
const Session = require("../../core/session.js");
const { db } = require("../../config/db.js");

const apiId = path.parse(__dirname).name;

module.exports = new Session(apiId, db, Client);


```
## \src\modules\jsonplaceholder\client.js

```js
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


```
## \src\modules\jsonplaceholder\controller.js

```js
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


```
## \src\modules\jsonplaceholder\index.js

```js
const express = require("express");
const controller = require("./controller.js");

const router = express.Router();

router.post("/:sessionId/posts", controller.postPosts);
router.get("/:sessionId/posts/:id", controller.getPostsId);
router.get("/:sessionId/posts", controller.getPosts);
router.patch("/:sessionId/posts/:id", controller.patchPostsId);
router.put("/:sessionId/posts/:id", controller.putPostsId);
router.delete("/:sessionId/posts/:id", controller.deletePostsId);
router.get("/:sessionId/posts/:id/comments", controller.getPostsIdComments);

module.exports = {
    path: "/api/jsonplaceholder",
    router,
};


```
## \src\modules\jsonplaceholder\repository.js

```js
const BaseRepository = require("../../core/repository.js");
const { db } = require("../../config/db.js");

class Repository extends BaseRepository {
    table = "jsonplaceholder";
    primaryKey = "id";
    columns = {
        id: {},
        name: {},
    };
}

module.exports = new Repository(db);


```
## \src\modules\jsonplaceholder\service.js

```js
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


```
## \src\modules\jsonplaceholder\session.js

```js
const path = require("path");
const Client = require("./client.js");
const Session = require("../../core/session.js");
const { db } = require("../../config/db.js");

const apiId = path.parse(__dirname).name;

module.exports = new Session(apiId, db, Client);


```
