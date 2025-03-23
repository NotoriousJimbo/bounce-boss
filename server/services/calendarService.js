/**
 * Google Calendar Service
 * 
 * Provides functions for interacting with Google Calendar API:
 * - Creating events for bookings
 * - Checking availability
 * - Updating/deleting events
 * - Managing buffer times
 */

const { createCalendarClient, GOOGLE_CALENDAR_ID, isGoogleCalendarConfigured } = require('../config/googleCalendar');
const { DateTime } = require('luxon'); // For better date handling
const logger = require('../utils/logger');
const { withRetry, retryPredicates } = require('../utils/retry');

// Buffer times in minutes (before and after events)
const DEFAULT_BUFFER_BEFORE = 60; // 1 hour setup time
const DEFAULT_BUFFER_AFTER = 60; // 1 hour teardown time

/**
 * Create a calendar event for a booking
 * 
 * @param {Object} booking - The booking data
 * @returns {Promise<Object>} - Created calendar event
 */
async function createBookingEvent(booking) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return a mock event
    if (disabled) {
      logger.warn('Calendar integration is disabled. Returning mock event for booking', { bookingId: booking.id });
      return {
        id: `mock-event-${Date.now()}`,
        htmlLink: '#',
        summary: `Bounce Boss Event: ${booking.fullName}`,
        status: 'confirmed',
        created: new Date().toISOString()
      };
    }
    
    // Calculate event start and end times with buffers
    const eventStart = DateTime.fromISO(booking.eventDate)
      .set({ hour: parseInt(booking.startTime.split(':')[0]), minute: parseInt(booking.startTime.split(':')[1]) })
      .minus({ minutes: DEFAULT_BUFFER_BEFORE });
      
    const eventEnd = DateTime.fromISO(booking.eventDate)
      .set({ hour: parseInt(booking.endTime.split(':')[0]), minute: parseInt(booking.endTime.split(':')[1]) })
      .plus({ minutes: DEFAULT_BUFFER_AFTER });
    
    // Format attendees list if customer email exists
    const attendees = booking.email ? [{ email: booking.email }] : [];
    
    // Construct address for location
    const location = [
      booking.address,
      booking.city,
      booking.state,
      booking.zipCode
    ].filter(Boolean).join(', ');
    
    // Create the event
    const event = {
      summary: `Bounce Boss Event: ${booking.fullName}`,
      location,
      description: `
Booking ID: ${booking.id}
Customer: ${booking.fullName}
Phone: ${booking.phone}
Products: ${booking.products?.map(p => p.name).join(', ') || 'Not specified'}
Notes: ${booking.specialInstructions || 'None'}
      `.trim(),
      start: {
        dateTime: eventStart.toISO(),
        timeZone: 'America/Vancouver',
      },
      end: {
        dateTime: eventEnd.toISO(),
        timeZone: 'America/Vancouver',
      },
      attendees,
      // Add booking ID to event properties for future reference
      extendedProperties: {
        private: {
          bookingId: booking.id,
          bufferBefore: String(DEFAULT_BUFFER_BEFORE),
          bufferAfter: String(DEFAULT_BUFFER_AFTER),
        },
      },
      // Color ID for bounce house events (adjust as needed)
      colorId: '1', // Blue
      // Send notifications to attendees
      sendUpdates: 'all',
    };
    
    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
    });
    
    logger.info('Calendar event created successfully', { 
      eventId: response.data.id, 
      bookingId: booking.id,
      url: response.data.htmlLink
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error creating calendar event:', { 
      error, 
      bookingId: booking.id 
    });
    
    // Return mock data in case of error, to prevent booking flow from breaking
    return {
      id: `error-event-${Date.now()}`,
      htmlLink: '#',
      summary: `Bounce Boss Event: ${booking.fullName}`,
      status: 'tentative',
      created: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Check if a time slot is available
 * 
 * @param {string} date - Event date (YYYY-MM-DD)
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {string} excludeBookingId - Optional booking ID to exclude from check (for updates)
 * @returns {Promise<{available: boolean, conflicts: Array}>}
 */
async function checkAvailability(date, startTime, endTime, excludeBookingId = null) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return that everything is available
    if (disabled) {
      logger.warn('Calendar integration is disabled. Assuming time slot is available.');
      return {
        available: true,
        conflicts: []
      };
    }
    
    // Calculate event time with buffers
    const eventStart = DateTime.fromISO(`${date}T${startTime}`)
      .minus({ minutes: DEFAULT_BUFFER_BEFORE });
      
    const eventEnd = DateTime.fromISO(`${date}T${endTime}`)
      .plus({ minutes: DEFAULT_BUFFER_AFTER });
    
    // Get all events for that day (midnight to midnight)
    const dayStart = DateTime.fromISO(date).startOf('day');
    const dayEnd = DateTime.fromISO(date).endOf('day');
    
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: dayStart.toISO(),
      timeMax: dayEnd.toISO(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    
    // Find conflicts (events that overlap with the requested time)
    const conflicts = events.filter(event => {
      // Skip this event if it's the one we're updating
      if (excludeBookingId && 
          event.extendedProperties?.private?.bookingId === excludeBookingId) {
        return false;
      }
      
      const existingStart = DateTime.fromISO(event.start.dateTime);
      const existingEnd = DateTime.fromISO(event.end.dateTime);
      
      // Check for overlap
      return (
        (eventStart < existingEnd && eventStart >= existingStart) || // Start during existing event
        (eventEnd > existingStart && eventEnd <= existingEnd) || // End during existing event
        (eventStart <= existingStart && eventEnd >= existingEnd) // Encompasses existing event
      );
    });
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime,
        end: event.end.dateTime,
        bookingId: event.extendedProperties?.private?.bookingId,
      })),
    };
  } catch (error) {
    logger.error('Error checking availability:', { error, date, startTime, endTime });
    
    // Return available=true by default to prevent blocking bookings due to errors
    // This is a business decision - better to double-book than lose bookings
    return {
      available: true,
      conflicts: [],
      error: error.message
    };
  }
}

/**
 * Update an existing booking event
 * 
 * @param {string} eventId - Google Calendar event ID
 * @param {Object} booking - Updated booking data
 * @returns {Promise<Object>} - Updated event
 */
async function updateBookingEvent(eventId, booking) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return mock success
    if (disabled) {
      logger.warn('Calendar integration is disabled. Returning mock update success.', { bookingId: booking.id });
      return {
        id: eventId,
        status: booking.status === 'cancelled' ? 'cancelled' : 'confirmed',
        updated: new Date().toISOString()
      };
    }
    
    // Use retry mechanism for getting the existing event
    const existingEvent = await withRetry(
      async () => {
        return await calendar.events.get({
          calendarId: GOOGLE_CALENDAR_ID,
          eventId: eventId,
        });
      },
      {
        maxRetries: 3,
        shouldRetry: retryPredicates.any(
          retryPredicates.networkErrors,
          retryPredicates.http5xxErrors
        )
      }
    );
    
    // Calculate event start and end times with buffers
    const eventStart = DateTime.fromISO(booking.eventDate)
      .set({ hour: parseInt(booking.startTime.split(':')[0]), minute: parseInt(booking.startTime.split(':')[1]) })
      .minus({ minutes: DEFAULT_BUFFER_BEFORE });
      
    const eventEnd = DateTime.fromISO(booking.eventDate)
      .set({ hour: parseInt(booking.endTime.split(':')[0]), minute: parseInt(booking.endTime.split(':')[1]) })
      .plus({ minutes: DEFAULT_BUFFER_AFTER });
    
    // Construct address for location
    const location = [
      booking.address,
      booking.city,
      booking.state,
      booking.zipCode
    ].filter(Boolean).join(', ');
    
    // Update the event
    const updatedEvent = {
      ...existingEvent.data,
      summary: `Bounce Boss Event: ${booking.fullName}`,
      location,
      description: `
Booking ID: ${booking.id}
Customer: ${booking.fullName}
Phone: ${booking.phone}
Products: ${booking.products?.map(p => p.name).join(', ') || 'Not specified'}
Notes: ${booking.specialInstructions || 'None'}
Status: ${booking.status}
      `.trim(),
      start: {
        dateTime: eventStart.toISO(),
        timeZone: 'America/Vancouver',
      },
      end: {
        dateTime: eventEnd.toISO(),
        timeZone: 'America/Vancouver',
      },
      // Update status based on booking status
      status: booking.status === 'cancelled' ? 'cancelled' : 'confirmed',
    };
    
    // Preserve attendees if they exist
    if (existingEvent.data.attendees) {
      updatedEvent.attendees = existingEvent.data.attendees;
    }
    
    const response = await calendar.events.update({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: 'all', // Notify attendees of changes
    });
    
    logger.info('Calendar event updated successfully', { 
      eventId, 
      bookingId: booking.id,
      url: response.data.htmlLink
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error updating calendar event:', { 
      error, 
      eventId,
      bookingId: booking.id 
    });
    
    // Return mock data to avoid breaking the booking flow
    return {
      id: eventId,
      status: booking.status === 'cancelled' ? 'cancelled' : 'confirmed',
      updated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Delete a booking event
 * 
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<void>}
 */
async function deleteBookingEvent(eventId) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return mock success
    if (disabled) {
      logger.warn('Calendar integration is disabled. Skipping event deletion.', { eventId });
      return { success: true };
    }
    
    // Use retry mechanism for deletion
    await withRetry(
      async () => {
        return await calendar.events.delete({
          calendarId: GOOGLE_CALENDAR_ID,
          eventId: eventId,
          sendUpdates: 'all', // Notify attendees
        });
      },
      {
        maxRetries: 3,
        shouldRetry: retryPredicates.any(
          retryPredicates.networkErrors,
          retryPredicates.http5xxErrors
        )
      }
    );
    
    logger.info('Calendar event deleted successfully', { eventId });
    return { success: true };
  } catch (error) {
    logger.error('Error deleting calendar event:', { error, eventId });
    
    // Return success anyway to avoid breaking the booking flow
    return { 
      success: true,  
      error: error.message
    };
  }
}

/**
 * Find event by booking ID
 * 
 * @param {string} bookingId - Booking ID to search for
 * @returns {Promise<Object|null>} - Calendar event or null if not found
 */
async function findEventByBookingId(bookingId) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return null
    if (disabled) {
      logger.warn('Calendar integration is disabled. Cannot find event by booking ID.', { bookingId });
      return null;
    }
    
    // We need to search all events since we're looking by custom property
    // Limit to 3 months for performance
    const threeMonthsAgo = DateTime.now().minus({ months: 3 }).toISO();
    const threeMonthsAhead = DateTime.now().plus({ months: 3 }).toISO();
    
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: threeMonthsAgo,
      timeMax: threeMonthsAhead,
      singleEvents: true,
      maxResults: 2500,
    });
    
    const events = response.data.items || [];
    
    // Find the event with matching booking ID
    const matchingEvent = events.find(event => 
      event.extendedProperties?.private?.bookingId === bookingId
    );
    
    return matchingEvent || null;
  } catch (error) {
    logger.error('Error finding event by booking ID:', { error, bookingId });
    return null;
  }
}

/**
 * Get upcoming events
 * 
 * @param {number} days - Number of days to look ahead
 * @returns {Promise<Array>} - List of upcoming events
 */
async function getUpcomingEvents(days = 14) {
  try {
    const { calendar, disabled } = createCalendarClient();
    
    // If calendar integration is disabled, return empty array
    if (disabled) {
      logger.warn('Calendar integration is disabled. Returning empty upcoming events.');
      return [];
    }
    
    const now = DateTime.now();
    const future = now.plus({ days });
    
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: now.toISO(),
      timeMax: future.toISO(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });
    
    return response.data.items || [];
  } catch (error) {
    logger.error('Error getting upcoming events:', { error, days });
    return [];
  }
}

module.exports = {
  createBookingEvent,
  checkAvailability,
  updateBookingEvent,
  deleteBookingEvent,
  findEventByBookingId,
  getUpcomingEvents,
  DEFAULT_BUFFER_BEFORE,
  DEFAULT_BUFFER_AFTER,
};
