const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPaymentIntent } = require('../config/stripe');
const bookingData = require('../data/bookingData');
const emailService = require('../services/emailService');
const { PAYMENT_STATUSES } = require('../models/booking');

// Create a payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Store the booking ID as metadata in the payment intent
        const metadata = bookingId ? { bookingId } : {};
        const paymentIntent = await createPaymentIntent(amount, metadata);
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Confirm a payment
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, bookingId } = req.body;
        
        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID is required' });
        }

        const paymentIntent = await confirmPaymentIntent(paymentIntentId);
        
        // If payment is successful and we have a booking ID, update the booking and send email
        if (paymentIntent.status === 'succeeded' && (bookingId || paymentIntent.metadata?.bookingId)) {
            const bookingToUpdate = bookingId || paymentIntent.metadata.bookingId;
            
            try {
                // Get the booking
                const booking = await bookingData.getBookingById(bookingToUpdate);
                if (booking) {
                    // Update the booking with payment information
                    const updateData = {
                        payment_status: PAYMENT_STATUSES.PAID,
                        payment_amount: paymentIntent.amount,
                        payment_id: paymentIntent.id,
                        payment_date: new Date().toISOString()
                    };
                    
                    const updatedBooking = await bookingData.updateBooking(bookingToUpdate, updateData);
                    
                    // Send payment receipt email
                    if (updatedBooking.email) {
                        try {
                            await emailService.sendPaymentReceiptEmail(
                                updatedBooking,
                                paymentIntent,
                                updatedBooking.email
                            );
                        } catch (emailError) {
                            console.error('Failed to send payment receipt email:', emailError);
                            // Continue despite email error
                        }
                    }
                }
            } catch (bookingError) {
                console.error('Error updating booking after payment:', bookingError);
                // Continue despite booking update error
            }
        }
        
        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

module.exports = router;
