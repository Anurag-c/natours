const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const crypto = require('crypto');
const Email = require('./../utils/emails');

const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES
    });
};

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true // cookie cannot be modified by browser
    };

    if (req.secure || req.headers('x-forwarded-proto') === 'https') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: {
                MongoId: user._id,
                name: user.name,
                email: user.email
            }
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    /*const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();*/

    createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError('Please provide email and password', 400));

    const user = await User.findOne({ email: email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError('Incorrect email or password', 401));

    createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 2.5 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('Your are not logged in !!', 401));
    }

    // 2) token verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check User exist or not
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('User belonging to this user no longer exist', 401));
    }

    // 4) Check if user changed password after the token issued.
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User Recently changed Password !!! login again', 401));
    }

    req.user = user;
    res.locals.user = user;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // due to closure
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get User based on email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address', 404));
    }
    // 2) get reset token and save (encrypted ones are saved)
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) sending mails
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    try {
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an Error sending Email', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) get user based on the Token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    //2) If token is not expired, and there is user, set the new password
    if (!user) return next(new AppError('Token is Invalid or Expired', 400));

    //3) Update changePasswordAt
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //4) Log the user in, send JWT
    createAndSendToken(user, 201, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) get user from the collection
    const user = await User.findOne(req.user._id).select('+password');

    // 2) check whether posted password is correctPassword
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Current Password is incorrect', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // password.changedAt is implemented in middleware

    // 3) log user in, send JWT
    createAndSendToken(user, 201, req, res);
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id);

            // 4) Check if user changed password after the token issued.
            if (user?.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            res.locals.user = user;
        } catch (err) {
            res.locals.user = undefined;
            return next();
        }
    }
    return next();
};
