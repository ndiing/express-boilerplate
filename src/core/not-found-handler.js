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
