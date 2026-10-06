function errorHandler() {
    return function (err, req, res, next) {
        res.status(err.status || 500).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                ...(process.env.NODE_ENV === "development" && {
                    stack: err.stack,
                }),
            },
        });
    };
}
exports.errorHandler = errorHandler;
