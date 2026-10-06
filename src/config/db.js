const Database = require("@ndiinginc/dal");

const db = new Database({
    client: "better-sqlite3",
    connection: {
        database: "./express-boilerplate.db",
    },
    migrations: {
        directory: "migrations",
        tableName: "migrations",
    },
});
exports.db = db;
