const path = require("path");
const Client = require("./client.js");
const Session = require("../../core/session.js");
const { db } = require("../../config/db.js");

const apiId = path.parse(__dirname).name;

module.exports = new Session(apiId, db, Client);
