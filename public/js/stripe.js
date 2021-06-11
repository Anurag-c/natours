import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
    'pk_test_51J1225SJXSNEDbiRVQwFAxjaVWuYen0tSiOTKUU5EKEXIlFgmo2jaCU6m54sFgvcPjI21DZrzlA7zSopuHLJdxKl00BJ0u4wDo'
);

export const bookTour = async (tourId) => {
    try {
        // 1) Get Checkout session from API
        const session = await axios(
            `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        console.log(session);
        // 2) create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        showAlert('error', err);
    }
};
