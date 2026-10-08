const { AppError } = require("./app-error.js");

function notFoundHandler() {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
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
