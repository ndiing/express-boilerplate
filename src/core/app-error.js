/**
 * @typedef AppErrorOptions
 * @property {Number} status
 * @property {String} code
 * @property {String} message
 * @property {Array} details
 */

class AppError extends Error {
    constructor({ status = 500, code = null, message = "Internal Server Error", details = null } = {}) {
        super(message);

        this.status = status;
        this.code = code;
        this.details = details;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
