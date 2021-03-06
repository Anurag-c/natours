const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //1) get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    //2) create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'inr',
                quantity: 1
            }
        ],
        mode: 'payment'
    });
    //3) create session as response
    res.status(200).json({
        status: 'success',
        session
    });
});

//exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//    const { tour, user, price } = req.query;
//    if (!tour || !user || !price) return next();
//
//    await Booking.create({ tour, user, price });
//
//    res.redirect(`${req.protocol}://${req.get('host')}/`);
//});

const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const email = session.customer_email.trim();
    const user = await User.findOne({ email });
    const price = session.amount_total / 100;
    await Booking.create({ tour, user: user._id, price });
};

exports.webhookCheckout = async (req, res, next) => {
    let event;
    try {
        const signature = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        if (event.type === 'checkout.session.completed') {
            console.log(event);
            await createBookingCheckout(event.data.object);
        }
    } catch (err) {
        return res.status(400).send('Webhook error: ' + err);
    }
    res.status(200).json({ received: true });
};
