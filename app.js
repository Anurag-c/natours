const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
//const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.enable('trust proxy');

// Data sanitization against XSS(cross side scripting)
app.use(xss());

//Set security HTTP headers
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            'script-src': ["'self'", '*.cloudflare.com', '*.mapbox.com', '*.stripe.com'],
            'style-src': ["'self'", '*.mapbox.com', 'fonts.googleapis.com', "'unsafe-inline'"],
            'connect-src': ["'self'", 'ws://localhost:8080', '*.mapbox.com'],
            'worker-src': ["'self'", 'blob:'],
            'frame-src': ["'self'", '*.stripe.com']
        }
    })
);

// CORS
/*app.use(
    cors({
        origin: true,
        credentials: true
    })
);*/

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit Requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSql query Injection
app.use(mongoSanitize());

// prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

app.use(compression());
// SET pug as view Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// logging cookies
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// View Route
app.use('/', viewRouter);

// API ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// Routes which are not defined
app.all('*', (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
    next(err);
});

// All errors come down to this point
app.use(globalErrorHandler);

module.exports = app;
