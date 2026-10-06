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
