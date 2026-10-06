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
