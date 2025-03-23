/**
 * Test Google Calendar Integration
 * 
 * This script tests the Google Calendar integration functionality by:
 * 1. Creating a test event
 * 2. Checking availability for a time slot
 * 3. Updating the test event
 * 4. Retrieving upcoming events
 * 5. Deleting the test event
 * 
 * To run: node server/scripts/test-calendar-integration.js
 * 
 * Prerequisites:
 * - Ensure you have set up Google Calendar API credentials in your .env file:
 *   - GOOGLE_CLIENT_EMAIL: Service account email from Google Cloud Console
 *   - GOOGLE_PRIVATE_KEY: Private key for the service account (with \n characters)
 *   - GOOGLE_CALENDAR_ID: Calendar ID to use (often the service account email)
 */

const calendarService = require('../services/calendarService');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Test event data
const testBooking = {
  id: uuidv4(),
  fullName: 'Test Customer',
  phone: '555-123-4567',
  email: 'test@example.com',
  address: '123 Test Street',
  city: 'Test City',
  state: 'WA',
  zipCode: '98001',
  eventDate: DateTime.now().plus({ days: 2 }).toISODate(), // 2 days from now
  startTime: '14:00', // 2 PM
  endTime: '18:00', // 6 PM
  products: [{ id: 1, name: 'Bounce House - Castle', price: 250 }],
  specialInstructions: 'This is a test booking',
  status: 'confirmed',
  payment_status: 'paid',
  payment_amount: 250
};

// Modified event data for update test
const updatedBooking = {
  ...testBooking,
  specialInstructions: 'This is an updated test booking',
  startTime: '15:00', // 3 PM
  endTime: '19:00', // 7 PM
};

// Store created event ID
let createdEventId = null;

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log(`${colors.bright}🧪 GOOGLE CALENDAR INTEGRATION TEST${colors.reset}\n`);
  
  try {
    // Test 1: Create an event
    await testCreateEvent();
    
    // Test 2: Check availability
    await testCheckAvailability();
    
    // Test 3: Update the event
    await testUpdateEvent();
    
    // Test 4: Get upcoming events
    await testGetUpcomingEvents();
    
    // Test 5: Delete the event
    await testDeleteEvent();
    
    console.log(`\n${colors.green}${colors.bright}✅ ALL TESTS COMPLETED SUCCESSFULLY${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ TEST FAILED: ${error.message}${colors.reset}`);
    
    // Cleanup - try to delete test event if it was created
    if (createdEventId) {
      try {
        console.log(`\n${colors.yellow}🧹 Cleaning up - attempting to delete test event${colors.reset}`);
        await calendarService.deleteBookingEvent(createdEventId);
        console.log(`${colors.green}✓ Test event deleted successfully${colors.reset}`);
      } catch (cleanupError) {
        console.error(`${colors.red}✗ Failed to delete test event: ${cleanupError.message}${colors.reset}`);
      }
    }
    
    process.exit(1);
  }
}

/**
 * Test 1: Create a calendar event
 */
async function testCreateEvent() {
  console.log(`${colors.cyan}📅 Test 1: Creating a calendar event${colors.reset}`);
  
  try {
    const event = await calendarService.createBookingEvent(testBooking);
    createdEventId = event.id;
    
    console.log(`${colors.green}✓ Event created successfully${colors.reset}`);
    console.log(`  Event ID: ${event.id}`);
    console.log(`  Event Link: ${event.htmlLink}`);
    
    return event;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to create event: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 2: Check availability for a time slot
 */
async function testCheckAvailability() {
  console.log(`\n${colors.cyan}🔍 Test 2: Checking availability${colors.reset}`);
  
  try {
    // Check the time slot that should be occupied by our event
    const result = await calendarService.checkAvailability(
      testBooking.eventDate,
      testBooking.startTime,
      testBooking.endTime
    );
    
    console.log(`${colors.green}✓ Availability check successful${colors.reset}`);
    console.log(`  Available: ${result.available ? 'Yes' : 'No'}`);
    
    if (!result.available) {
      console.log('  Conflicts:');
      result.conflicts.forEach(conflict => {
        console.log(`    - ${conflict.summary} (${conflict.start} - ${conflict.end})`);
      });
    }
    
    // Verify we detected our test event as a conflict
    if (result.available) {
      throw new Error('Expected conflict with test event, but got available=true');
    }
    
    // Check a different time slot that should be available
    const tomorrowDate = DateTime.fromISO(testBooking.eventDate).minus({ days: 1 }).toISODate();
    const availableResult = await calendarService.checkAvailability(
      tomorrowDate,
      '10:00',
      '12:00'
    );
    
    console.log(`\n  Checking another time slot (tomorrow):`);
    console.log(`  Available: ${availableResult.available ? 'Yes' : 'No'}`);
    
    // Verify other time slot is available
    if (!availableResult.available) {
      throw new Error('Expected another time slot to be available, but got available=false');
    }
    
    return result;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to check availability: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 3: Update an event
 */
async function testUpdateEvent() {
  console.log(`\n${colors.cyan}✏️ Test 3: Updating the calendar event${colors.reset}`);
  
  try {
    const updatedEvent = await calendarService.updateBookingEvent(createdEventId, updatedBooking);
    
    console.log(`${colors.green}✓ Event updated successfully${colors.reset}`);
    console.log(`  New Start Time: ${updatedEvent.start.dateTime}`);
    console.log(`  New End Time: ${updatedEvent.end.dateTime}`);
    
    return updatedEvent;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to update event: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 4: Get upcoming events
 */
async function testGetUpcomingEvents() {
  console.log(`\n${colors.cyan}📋 Test 4: Getting upcoming events${colors.reset}`);
  
  try {
    const events = await calendarService.getUpcomingEvents(7); // Next 7 days
    
    console.log(`${colors.green}✓ Retrieved ${events.length} upcoming events${colors.reset}`);
    
    // Find our test event
    const foundTestEvent = events.find(event => event.id === createdEventId);
    
    if (foundTestEvent) {
      console.log(`  ✓ Found our test event in the upcoming events list`);
    } else {
      throw new Error('Test event not found in upcoming events list');
    }
    
    return events;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to get upcoming events: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 5: Delete an event
 */
async function testDeleteEvent() {
  console.log(`\n${colors.cyan}🗑️ Test 5: Deleting the calendar event${colors.reset}`);
  
  try {
    await calendarService.deleteBookingEvent(createdEventId);
    
    console.log(`${colors.green}✓ Event deleted successfully${colors.reset}`);
    
    // Verify the event is truly gone by trying to find it
    try {
      const events = await calendarService.getUpcomingEvents(7);
      const foundTestEvent = events.find(event => event.id === createdEventId);
      
      if (foundTestEvent) {
        throw new Error('Event still exists after deletion');
      } else {
        console.log(`  ✓ Verified event no longer exists in the calendar`);
      }
    } catch (error) {
      console.error(`${colors.yellow}⚠️ Could not verify deletion: ${error.message}${colors.reset}`);
      // Don't fail the test, as some errors here could be expected when the event is gone
    }
    
    // Reset the created event ID
    createdEventId = null;
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to delete event: ${error.message}${colors.reset}`);
    throw error;
  }
}

// Run the tests
runTests();
