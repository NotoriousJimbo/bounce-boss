const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Stripe with your secret key
const initializeStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    return stripe;
};

// Create a payment intent
const createPaymentIntent = async (amount, metadata = {}, currency = 'cad') => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency,
            metadata, // Add metadata (e.g., bookingId)
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return paymentIntent;
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};

// Confirm a payment intent
const confirmPaymentIntent = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error('Error confirming payment intent:', error);
        throw error;
    }
};

module.exports = {
    stripe,
    initializeStripe,
    createPaymentIntent,
    confirmPaymentIntent
};
