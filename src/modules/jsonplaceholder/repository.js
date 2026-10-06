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
