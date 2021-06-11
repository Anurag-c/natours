const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const { getToursWithin } = require('./tourController');

exports.getOverview = catchAsync(async (req, res) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) build template
    // 3) render template
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    //1) Get the data, for requested tour including reviews and giudes
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    //2) BUild template
    //3) render template
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLogin = (req, res) => {
    res.status(200).render('login', { title: 'Login' });
};

exports.getSignUp = (req, res) => {
    res.status(200).render('signup', { title: 'Sign up' });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIds = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });
    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: getToursWithin,
            runValidators: true
        }
    );
    res.redirect('/me');
});
