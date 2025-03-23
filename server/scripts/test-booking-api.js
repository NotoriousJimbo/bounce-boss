/**
 * Test script for booking API endpoints
 * 
 * This script tests the basic functionality of the booking API endpoints
 * Note: Due to the known database schema issue (BUG-001), some tests
 * may not fully succeed when interacting with the database.
 * 
 * How to run:
 * 1. Start the server: node server/server.js
 * 2. In a new terminal: node server/scripts/test-booking-api.js
 */

const axios = require('axios');

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3001/api';

// Sample booking data for testing
const sampleBooking = {
  customer_first_name: 'John',
  customer_last_name: 'Doe',
  customer_email: 'john.doe@example.com',
  customer_phone: '555-123-4567',
  
  event_date: '2025-05-15',
  event_start_time: '14:00',
  event_end_time: '18:00',
  event_address: '123 Party Lane',
  event_city: 'Funtown',
  event_postal_code: '12345',
  indoor_outdoor: 'outdoor',
  
  products: [
    {
      id: 'product-1',
      name: 'Bounce House Basic',
      price: 150,
      quantity: 1
    }
  ],
  
  subtotal: 150,
  tax: 15,
  total: 165,
  
  terms_accepted: true
};

// Test functions

/**
 * Test getting all bookings
 */
async function testGetAllBookings() {
  console.log('\n🔍 Testing GET /api/bookings');
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings`);
    console.log('✅ GET all bookings success!');
    console.log(`  Status: ${response.status}`);
    console.log(`  Retrieved ${response.data.count} bookings`);
    return response.data;
  } catch (error) {
    console.error('❌ GET all bookings failed:');
    console.error(`  Status: ${error.response?.status || 'Unknown'}`);
    console.error(`  Message: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test getting a single booking by ID
 */
async function testGetBookingById(id = '00000000-0000-0000-0000-000000000000') {
  console.log(`\n🔍 Testing GET /api/bookings/${id}`);
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings/${id}`);
    console.log('✅ GET booking by ID success!');
    console.log(`  Status: ${response.status}`);
    return response.data;
  } catch (error) {
    // 404 is expected for a non-existent ID
    if (error.response?.status === 404) {
      console.log('ℹ️ GET booking by ID returned 404 (expected for test ID)');
    } else {
      console.error('❌ GET booking by ID failed:');
      console.error(`  Status: ${error.response?.status || 'Unknown'}`);
      console.error(`  Message: ${error.response?.data?.message || error.message}`);
    }
  }
}

/**
 * Test creating a new booking
 */
async function testCreateBooking() {
  console.log('\n🔍 Testing POST /api/bookings');
  try {
    const response = await axios.post(`${API_BASE_URL}/bookings`, sampleBooking);
    console.log('✅ CREATE booking success!');
    console.log(`  Status: ${response.status}`);
    console.log(`  Booking ID: ${response.data.data.id}`);
    return response.data.data;
  } catch (error) {
    console.error('❌ CREATE booking failed:');
    console.error(`  Status: ${error.response?.status || 'Unknown'}`);
    console.error(`  Message: ${error.response?.data?.message || error.message}`);
    
    // If there's a validation error, show the details
    if (error.response?.data?.error === 'validation_error') {
      console.error(`  Validation errors: ${error.response.data.message}`);
    }
    
    // If there's a database error due to known schema mismatch, show a helpful message
    if (error.response?.data?.error?.includes('Could not find the') ||
        error.response?.data?.error?.includes('column') ||
        error.response?.data?.error?.includes('schema')) {
      console.log('\n⚠️ Known Issue: This is likely related to BUG-001 (Schema Mismatch)');
      console.log('   See known_issues.md for more information');
    }
  }
}

/**
 * Test checking date availability
 */
async function testCheckAvailability() {
  console.log('\n🔍 Testing GET /api/bookings/availability/check');
  
  const date = '2025-05-20';
  const startTime = '10:00';
  const endTime = '14:00';
  
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings/availability/check`, {
      params: { date, startTime, endTime }
    });
    console.log('✅ CHECK availability success!');
    console.log(`  Status: ${response.status}`);
    console.log(`  Date ${date} from ${startTime} to ${endTime} is ${response.data.available ? 'available ✅' : 'not available ❌'}`);
    return response.data;
  } catch (error) {
    console.error('❌ CHECK availability failed:');
    console.error(`  Status: ${error.response?.status || 'Unknown'}`);
    console.error(`  Message: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test upcoming bookings endpoint
 */
async function testUpcomingBookings() {
  console.log('\n🔍 Testing GET /api/bookings/upcoming/list');
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings/upcoming/list`);
    console.log('✅ GET upcoming bookings success!');
    console.log(`  Status: ${response.status}`);
    console.log(`  Retrieved ${response.data.count} upcoming bookings`);
    return response.data;
  } catch (error) {
    console.error('❌ GET upcoming bookings failed:');
    console.error(`  Status: ${error.response?.status || 'Unknown'}`);
    console.error(`  Message: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test date range endpoint
 */
async function testDateRangeBookings() {
  console.log('\n🔍 Testing GET /api/bookings/range/dates');
  
  const startDate = '2025-05-01';
  const endDate = '2025-05-31';
  
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings/range/dates`, {
      params: { startDate, endDate }
    });
    console.log('✅ GET date range bookings success!');
    console.log(`  Status: ${response.status}`);
    console.log(`  Retrieved ${response.data.count} bookings between ${startDate} and ${endDate}`);
    return response.data;
  } catch (error) {
    console.error('❌ GET date range bookings failed:');
    console.error(`  Status: ${error.response?.status || 'Unknown'}`);
    console.error(`  Message: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Run all tests sequentially
 */
async function runAllTests() {
  console.log('🚀 Starting Booking API Tests');
  console.log('============================');
  
  // Test GET endpoints first (safer)
  await testGetAllBookings();
  await testGetBookingById();
  await testCheckAvailability();
  await testUpcomingBookings();
  await testDateRangeBookings();
  
  // Test POST endpoint last (creates data)
  const createdBooking = await testCreateBooking();
  
  // If a booking was created successfully, test retrieving it by ID
  if (createdBooking && createdBooking.id) {
    await testGetBookingById(createdBooking.id);
  }
  
  console.log('\n============================');
  console.log('🏁 Booking API Tests Complete');
  console.log('\n⚠️ Note about database issues:');
  console.log('If you see database errors, check known_issues.md for BUG-001');
  console.log('The current implementation contains a schema mismatch that');
  console.log('needs to be resolved before database operations will succeed.');
}

// Run the tests
runAllTests().catch(console.error);
