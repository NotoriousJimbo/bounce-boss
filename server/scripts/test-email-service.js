/**
 * Test Email Service
 * This script tests the email notification system to verify it's working correctly
 * 
 * Run with: node server/scripts/test-email-service.js
 * 
 * Note: You must set up the email environment variables in .env first:
 * - EMAIL_USER: Your Gmail address
 * - EMAIL_PASS: Your Gmail app password
 * - ADMIN_EMAIL: Admin email for receiving notifications
 */

require('dotenv').config();
const emailService = require('../services/emailService');

// Sample booking data for testing
const testBooking = {
  id: 'test-booking-123',
  firstName: 'Test',
  lastName: 'Customer',
  email: process.env.EMAIL_USER, // Send to ourselves for testing
  phone: '555-123-4567',
  address: '123 Test St',
  city: 'Vancouver',
  state: 'BC',
  zipCode: 'V6G 1A1',
  eventDate: new Date().toISOString().split('T')[0], // Today
  setupTime: '10:00 AM',
  pickupTime: '4:00 PM',
  productName: 'Castle Bounce House',
  products: [
    { name: 'Castle Bounce House', price: 19999, description: 'Fun for all ages' }
  ],
  amount: 19999, // $199.99
  specialRequests: 'Please set up in the backyard',
  createdAt: new Date().toISOString()
};

// Sample payment data for testing
const testPayment = {
  id: 'pi_test_payment_123',
  amount: 19999, // $199.99 in cents
  created: new Date().toISOString(),
  payment_method_details: {
    card: {
      brand: 'visa',
      last4: '4242'
    }
  }
};

/**
 * Run all email tests
 */
async function runEmailTests() {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│              EMAIL SERVICE TEST                 │');
  console.log('└─────────────────────────────────────────────────┘');
  
  console.log('\nChecking environment variables...');
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Error: The following environment variables are missing: ${missingVars.join(', ')}`);
    console.error('Please set these in your .env file and try again.');
    process.exit(1);
  }
  
  console.log('✓ Environment variables are set');
  
  console.log('\nTesting email service functions:');
  
  try {
    // Test 1: Booking confirmation email
    console.log('\n1. Testing booking confirmation email...');
    const confirmResult = await emailService.sendBookingConfirmationEmail(
      testBooking, 
      process.env.EMAIL_USER
    );
    console.log(`✓ Booking confirmation email sent: ${confirmResult.messageId}`);
    
    // Test 2: Payment receipt email
    console.log('\n2. Testing payment receipt email...');
    const receiptResult = await emailService.sendPaymentReceiptEmail(
      testBooking,
      testPayment,
      process.env.EMAIL_USER
    );
    console.log(`✓ Payment receipt email sent: ${receiptResult.messageId}`);
    
    // Test 3: Admin notification email (if ADMIN_EMAIL is set)
    if (process.env.ADMIN_EMAIL) {
      console.log('\n3. Testing admin notification email...');
      const adminResult = await emailService.sendAdminNotificationEmail(
        testBooking,
        testPayment
      );
      console.log(`✓ Admin notification email sent: ${adminResult.messageId}`);
    } else {
      console.log('\n3. Skipping admin notification email test (ADMIN_EMAIL not set)');
    }
    
    console.log('\n✓ All email tests completed successfully!');
    console.log('\nNote: Please check the email inbox to verify the emails were received and formatted correctly.');
    
  } catch (error) {
    console.error('\nError during email testing:', error);
    console.error('\nTroubleshooting tips:');
    console.error('- If using Gmail, make sure you\'re using an app password, not your account password');
    console.error('- Check that your Gmail account has less secure apps access enabled');
    console.error('- Verify that your email and password are correct in the .env file');
    console.error('- Check if your email service provider has sending limits or requires verification');
  }
}

// Run the tests
runEmailTests();
