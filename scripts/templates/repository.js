/**@param {import("../module").ParseResult} parsed*/
module.exports = (parsed) => /* prettier-ignore */ `const BaseRepository = require("../../core/repository.js");
const { db } = require("../../config/db.js");

class Repository extends BaseRepository {
    table = "${parsed.name}";
    primaryKey = "id";
    columns = {
        id: {},
        name: {},
    };
}

module.exports = new Repository(db);`;
