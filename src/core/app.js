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
