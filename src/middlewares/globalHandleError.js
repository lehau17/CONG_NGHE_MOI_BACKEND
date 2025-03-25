const globalErrorHandler = (err, req, res, next) => {
    const { message = "Internal server error", status = 500, dataError = null } = err;

    // Logging
    console.error("=>>>> ERROR HANDLER :--->", err);

    // Response error
    res.status(status).json({
        error: message,
        isSuccess: false,
        dataError
    });
};

export default globalErrorHandler;
