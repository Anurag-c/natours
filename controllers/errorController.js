const AppError = require('./../utils/appError');

const handleJWTError = () => new AppError('Invalid Token, please login again', 401);

const handleJWTExpiredError = () => new AppError('Token Expired, please login again', 401);

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateNameDB = (err) => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate Field value: ${value}`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors)
        .map((el) => el.message)
        .join(', ');
    const message = `Invalid input data: [${errors}]`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        console.log(err);
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    console.error(err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    //API
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        console.error('ERROR ----->', err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!!'
        });
    }
    //Render page
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            message: err.message
        });
    }
    console.error('ERROR ----->', err);
    return res.status(500).render({
        title: 'Something went wrong!',
        message: 'Please try again later'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
    else if (process.env.NODE_ENV === 'production') {
        let error = Object.assign(err);
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        else if (error.code === 11000) error = handleDuplicateNameDB(error);
        else if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        else if (error.name === 'JsonWebTokenError') error = handleJWTError();
        else if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
};
