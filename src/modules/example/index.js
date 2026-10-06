const express = require("express");
const controller = require("./controller.js");

const router = express.Router();

router.get("/:sessionId", controller.get);

module.exports = {
    path: "/api/example",
    router,
};
