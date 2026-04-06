const errorHandler = (err, _req, res, _next) => {
    // Log for debugging
    console.error("Error:", err);

    // Handles Mongoose Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ 
            status: 'fail',
            message: `Conflict: ${field} already exists.` 
        });
    }

    // Handles Mongoose Validation Errors (e.g., required fields missing)
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            status: 'fail',
            message: `Invalid input data: ${messages.join('. ')}`
        });
    }

    // Handle Custom ApiErrors or Default to 500
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        status: err.status || 'error',
        message: message
    });
};

module.exports = errorHandler;