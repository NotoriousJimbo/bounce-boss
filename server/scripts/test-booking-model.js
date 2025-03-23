/**
 * Test script for Booking Model and Data Layer
 * 
 * This script tests the functionality of the booking model validation
 * and data layer operations.
 * 
 * Usage: node server/scripts/test-booking-model.js
 */

require('dotenv').config();
const { 
  bookingSchema, 
  validatePrices, 
  validateTimes,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  VENUE_TYPES 
} = require('../models/booking');
const bookingData = require('../data/bookingData');

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
}

// Test data layer functions
async function testDataLayer() {
  printSection('TESTING BOOKING DATA LAYER');
  let createdBookingId = null;
  
  // Test 1: Create booking
  try {
    console.log(`${colors.dim}Attempting to create a test booking...${colors.reset}`);
    const newBooking = await bookingData.createBooking(validBookingData);
    createdBookingId = newBooking.id;
    logResult('Create booking', !!newBooking && !!newBooking.id, 
      `Created booking with ID: ${createdBookingId}`);
  } catch (error) {
    logResult('Create booking', false, error.message);
  }
  
  // Only continue with the rest of the tests if booking was created successfully
  if (createdBookingId) {
    // Test 2: Get booking by ID
    try {
      console.log(`${colors.dim}Retrieving booking by ID...${colors.reset}`);
      const retrievedBooking = await bookingData.getBookingById(createdBookingId);
      logResult('Get booking by ID', 
        !!retrievedBooking && retrievedBooking.id === createdBookingId && 
        retrievedBooking.customer_email === validBookingData.customer_email,
        `Retrieved booking for ${retrievedBooking.customer_first_name} ${retrievedBooking.customer_last_name}`);
    } catch (error) {
      logResult('Get booking by ID', false, error.message);
    }
    
    // Test 3: Get all bookings with filter
    try {
      console.log(`${colors.dim}Retrieving bookings with filter...${colors.reset}`);
      const bookings = await bookingData.getAllBookings({
        email: validBookingData.customer_email
      });
      logResult('Get bookings with filter', 
        Array.isArray(bookings) && bookings.length > 0,
        `Found ${bookings.length} bookings for email ${validBookingData.customer_email}`);
    } catch (error) {
      logResult('Get bookings with filter', false, error.message);
    }
    
    // Test 4: Update booking
    try {
      console.log(`${colors.dim}Updating booking...${colors.reset}`);
      const updateData = {
        event_notes: 'Updated test notes',
        admin_notes: 'Test admin notes'
      };
      const updatedBooking = await bookingData.updateBooking(createdBookingId, updateData);
      logResult('Update booking', 
        !!updatedBooking && updatedBooking.event_notes === updateData.event_notes,
        `Updated booking notes to: ${updatedBooking.event_notes}`);
    } catch (error) {
      logResult('Update booking', false, error.message);
    }
    
    // Test 5: Update booking status
    try {
      console.log(`${colors.dim}Updating booking status...${colors.reset}`);
      const updatedBooking = await bookingData.updateBookingStatus(
        createdBookingId, 
        BOOKING_STATUSES.CONFIRMED
      );
      logResult('Update booking status', 
        !!updatedBooking && updatedBooking.booking_status === BOOKING_STATUSES.CONFIRMED,
        `Updated booking status to: ${updatedBooking.booking_status}`);
    } catch (error) {
      logResult('Update booking status', false, error.message);
    }
    
    // Test 6: Check date availability
    try {
      console.log(`${colors.dim}Checking date availability...${colors.reset}`);
      // First, check the date of our test booking (should be unavailable)
      const testDate = validBookingData.event_date;
      const isUnavailable = await bookingData.checkDateAvailability(
        testDate, 
        validBookingData.event_start_time,
        validBookingData.event_end_time
      );
      logResult('Check date unavailability', 
        !isUnavailable,
        `Correctly identified ${testDate} as unavailable`);
        
      // Now check a different date (should be available)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const isAvailable = await bookingData.checkDateAvailability(
        tomorrowStr, 
        '10:00',
        '14:00'
      );
      logResult('Check date availability', 
        isAvailable,
        `Correctly identified ${tomorrowStr} as available`);
    } catch (error) {
      logResult('Check date availability', false, error.message);
    }
    
    // Test 7: Get upcoming bookings
    try {
      console.log(`${colors.dim}Getting upcoming bookings...${colors.reset}`);
      const upcomingBookings = await bookingData.getUpcomingBookings();
      logResult('Get upcoming bookings', 
        Array.isArray(upcomingBookings),
        `Found ${upcomingBookings.length} upcoming bookings`);
    } catch (error) {
      logResult('Get upcoming bookings', false, error.message);
    }
    
    // Test 8: Get bookings by date range
    try {
      console.log(`${colors.dim}Getting bookings in date range...${colors.reset}`);
      // Create a date range that includes our test booking
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const rangeBookings = await bookingData.getBookingsByDateRange(
        startDateStr, 
        endDateStr
      );
      logResult('Get bookings by date range', 
        Array.isArray(rangeBookings) && rangeBookings.length > 0,
        `Found ${rangeBookings.length} bookings between ${startDateStr} and ${endDateStr}`);
    } catch (error) {
      logResult('Get bookings by date range', false, error.message);
    }
    
    // Test 9: Delete booking (cleanup)
    // Comment out this test if you want to keep the test data
    try {
      console.log(`${colors.dim}Deleting test booking...${colors.reset}`);
      const deleteResult = await bookingData.deleteBooking(createdBookingId);
      logResult('Delete booking', deleteResult === true,
        `Booking with ID ${createdBookingId} deleted successfully`);
    } catch (error) {
      logResult('Delete booking', false, error.message);
    }
  } else {
    console.log(`${colors.yellow}Skipping remaining data layer tests since booking creation failed${colors.reset}`);
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}
==============================================
BOOKING MODEL & DATA LAYER TEST SCRIPT
==============================================
${colors.reset}`);
  
  try {
    // Test model validation first
    await testModelValidation();
    
    // Then test data layer
    await testDataLayer();
    
    console.log(`\n${colors.green}${colors.bright}Tests completed${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Test execution error: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
}

// Run the tests
runTests();
