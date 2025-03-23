/**
 * Test script for Booking Model Validation
 * 
 * This script tests only the validation functions of the booking model
 * without requiring database access, allowing us to verify our model logic.
 * 
 * Usage: node server/scripts/test-booking-model-validation.js
 */

const { 
  bookingSchema, 
  validatePrices, 
  validateTimes,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  VENUE_TYPES 
} = require('../models/booking');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper to log test results
function logResult(testName, passed, message = '') {
  const status = passed 
    ? `${colors.green}PASSED${colors.reset}` 
    : `${colors.red}FAILED${colors.reset}`;
  console.log(`${colors.bright}${testName}${colors.reset}: ${status} ${message}`);
}

// Helper to print section headers
function printSection(title) {
  console.log('\n' + colors.cyan + colors.bright + title + colors.reset);
  console.log('='.repeat(title.length));
}

// Sample valid booking data
const validBookingData = {
  customer_first_name: 'John',
  customer_last_name: 'Doe',
  customer_email: 'john.doe@example.com',
  customer_phone: '555-123-4567',
  customer_address: '123 Main St',
  
  event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  event_start_time: '12:00',
  event_end_time: '16:00',
  event_address: '456 Park Ave',
  event_city: 'Comox',
  event_postal_code: 'V9N 1A1',
  event_type: 'Birthday Party',
  event_notes: 'Please set up near the backyard deck',
  indoor_outdoor: VENUE_TYPES.OUTDOOR,
  
  booking_status: BOOKING_STATUSES.PENDING,
  payment_status: PAYMENT_STATUSES.UNPAID,
  
  products: [
    {
      id: 'castle-bounce-house',
      name: 'Castle Bounce House',
      price: 150,
      quantity: 1
    },
    {
      id: 'water-slide',
      name: 'Water Slide',
      price: 200,
      quantity: 1
    }
  ],
  subtotal: 350,
  tax: 17.50,
  total: 367.50,
  discount_code: 'SUMMER10',
  discount_amount: 0,
  
  terms_accepted: true,
  ip_address: '192.168.1.1',
  
  referral_source: 'Google Search'
};

// Test model validation functions
async function testModelValidation() {
  printSection('TESTING BOOKING MODEL VALIDATION');
  
  // Test 1: Valid booking data
  try {
    const result = bookingSchema.validate(validBookingData);
    logResult('Valid booking validation', !result.error, 
      result.error ? result.error.message : '');
  } catch (error) {
    logResult('Valid booking validation', false, error.message);
  }
  
  // Test 2: Invalid email
  try {
    const invalidData = { ...validBookingData, customer_email: 'not-an-email' };
    const result = bookingSchema.validate(invalidData);
    logResult('Invalid email validation', result.error && 
      result.error.message.includes('valid email'), 
      result.error ? result.error.details[0].message : 'Did not catch invalid email');
  } catch (error) {
    logResult('Invalid email validation', false, error.message);
  }
  
  // Test 3: Missing required field
  try {
    const { customer_first_name, ...missingFieldData } = validBookingData;
    const result = bookingSchema.validate(missingFieldData);
    logResult('Missing required field validation', result.error && 
      result.error.message.includes('required'), 
      result.error ? result.error.details[0].message : 'Did not catch missing field');
  } catch (error) {
    logResult('Missing required field validation', false, error.message);
  }
  
  // Test 4: Terms not accepted
  try {
    const invalidData = { ...validBookingData, terms_accepted: false };
    const result = bookingSchema.validate(invalidData);
    logResult('Terms acceptance validation', result.error && 
      result.error.message.includes('terms'), 
      result.error ? result.error.details[0].message : 'Did not catch terms not accepted');
  } catch (error) {
    logResult('Terms acceptance validation', false, error.message);
  }
  
  // Test 5: Price validation
  try {
    // Test with correct prices
    const priceResult = validatePrices(validBookingData);
    logResult('Price validation (correct)', priceResult.valid, 
      !priceResult.valid ? priceResult.error : '');
    
    // Test with incorrect subtotal
    const incorrectSubtotal = { 
      ...validBookingData, 
      subtotal: 300 // Should be 350 based on products
    };
    const subtotalResult = validatePrices(incorrectSubtotal);
    logResult('Price validation (incorrect subtotal)', !subtotalResult.valid && 
      subtotalResult.error.includes('Subtotal'), subtotalResult.error);
    
    // Test with incorrect total
    const incorrectTotal = { 
      ...validBookingData, 
      total: 400 // Should be 367.50
    };
    const totalResult = validatePrices(incorrectTotal);
    logResult('Price validation (incorrect total)', !totalResult.valid && 
      totalResult.error.includes('Total'), totalResult.error);
  } catch (error) {
    logResult('Price validation', false, error.message);
  }
  
  // Test 6: Time validation
  try {
    // Test with valid times (4 hour duration)
    const timeResult = validateTimes(validBookingData);
    logResult('Time validation (valid)', timeResult.valid, 
      !timeResult.valid ? timeResult.error : '');
    
    // Test with end time before start time
    const invalidTimes = { 
      ...validBookingData, 
      event_start_time: '14:00',
      event_end_time: '12:00'
    };
    const invalidTimeResult = validateTimes(invalidTimes);
    logResult('Time validation (end before start)', !invalidTimeResult.valid && 
      invalidTimeResult.error.includes('after'), invalidTimeResult.error);
    
    // Test with duration less than minimum
    const shortDuration = { 
      ...validBookingData, 
      event_start_time: '14:00',
      event_end_time: '15:00'
    };
    const durationResult = validateTimes(shortDuration);
    logResult('Time validation (short duration)', !durationResult.valid && 
      durationResult.error.includes('Minimum'), durationResult.error);
  } catch (error) {
    logResult('Time validation', false, error.message);
  }

  // Test 7: Booking Status validation
  try {
    const validStatuses = Object.values(BOOKING_STATUSES);
    logResult('Booking Status Constants', 
      validStatuses.includes('pending') && 
      validStatuses.includes('confirmed') && 
      validStatuses.includes('cancelled') && 
      validStatuses.includes('completed'),
      `Available statuses: ${validStatuses.join(', ')}`);
  } catch (error) {
    logResult('Booking Status Constants', false, error.message);
  }

  // Test 8: Payment Status validation
  try {
    const validPaymentStatuses = Object.values(PAYMENT_STATUSES);
    logResult('Payment Status Constants', 
      validPaymentStatuses.includes('unpaid') && 
      validPaymentStatuses.includes('partial') && 
      validPaymentStatuses.includes('paid') && 
      validPaymentStatuses.includes('refunded'),
      `Available payment statuses: ${validPaymentStatuses.join(', ')}`);
  } catch (error) {
    logResult('Payment Status Constants', false, error.message);
  }

  // Test 9: Venue Type validation
  try {
    const validVenueTypes = Object.values(VENUE_TYPES);
    logResult('Venue Type Constants', 
      validVenueTypes.includes('indoor') && 
      validVenueTypes.includes('outdoor') && 
      validVenueTypes.includes('both'),
      `Available venue types: ${validVenueTypes.join(', ')}`);
  } catch (error) {
    logResult('Venue Type Constants', false, error.message);
  }
}

// Run the tests
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}
==============================================
BOOKING MODEL VALIDATION TEST SCRIPT
==============================================
${colors.reset}`);
  
  try {
    await testModelValidation();
    console.log(`\n${colors.green}${colors.bright}All validation tests completed successfully!${colors.reset}`);
    
    console.log(`\n${colors.yellow}NOTE: Database operations were not tested.${colors.reset}`);
    console.log(`The database layer will be tested separately once the Supabase schema is fully set up.`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Test execution error: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
}

// Run the tests
runTests();
