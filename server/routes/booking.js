/**
 * Booking Routes
 * Handles all API endpoints for booking operations
 */
const express = require('express');
const router = express.Router();
const bookingData = require('../data/bookingData');
const { BOOKING_STATUSES, PAYMENT_STATUSES } = require('../models/booking');
const emailService = require('../services/emailService');
const calendarService = require('../services/calendarService');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, DatabaseError } = require('../utils/errors');
const { withRetry, retryPredicates } = require('../utils/retry');

/**
 * Create a new booking
 * POST /api/bookings
 */
router.post('/', async (req, res) => {
  try {
    // Add IP address to booking data for terms tracking
    const bookingDataWithIp = {
      ...req.body,
      ip_address: req.ip || req.connection.remoteAddress
    };

    // Check calendar availability before creating booking
    try {
      const { available, conflicts } = await calendarService.checkAvailability(
        req.body.eventDate,
        req.body.startTime,
        req.body.endTime
      );
      
      if (!available) {
        return res.status(409).json({
          success: false,
          message: 'The requested time slot is not available',
          error: 'time_conflict',
          conflicts
        });
      }
    } catch (calendarError) {
      logger.error('Error checking calendar availability:', { error: calendarError });
      // Continue with booking creation even if calendar check fails
      // We'll let admin know about this in the notification email
    }

    const booking = await bookingData.createBooking(bookingDataWithIp);
    
    // Create Google Calendar event
    try {
      const calendarEvent = await calendarService.createBookingEvent(booking);
      // Store the event ID in the booking record for future reference
      if (calendarEvent && calendarEvent.id) {
        await bookingData.updateBooking(booking.id, {
          calendar_event_id: calendarEvent.id
        });
      }
    } catch (calendarError) {
      logger.error('Failed to create calendar event:', { 
        error: calendarError, 
        bookingId: booking.id 
      });
      // Don't fail the booking creation if calendar fails
    }
    
    // Send admin notification email
    try {
      await emailService.sendAdminNotificationEmail(booking);
    } catch (emailError) {
      logger.error('Failed to send admin notification email:', { 
        error: emailError, 
        bookingId: booking.id 
      });
      // Don't fail the booking creation if email fails
    }
    
    // Send booking confirmation email if email is provided
    if (booking.email) {
      try {
        await emailService.sendBookingConfirmationEmail(booking, booking.email);
      } catch (emailError) {
        logger.error('Failed to send booking confirmation email:', { 
          error: emailError, 
          bookingId: booking.id,
          email: booking.email 
        });
        // Don't fail the booking creation if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error creating booking:', { error });
    // Check if it's a validation error
    if (error.message.includes('Validation error')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'validation_error'
      });
    }
    // Database or other errors
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

/**
 * Get a booking by ID
 * GET /api/bookings/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const booking = await bookingData.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        error: 'not_found'
      });
    }
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error retrieving booking:', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking',
      error: error.message
    });
  }
});

/**
 * Get all bookings with optional filters
 * GET /api/bookings
 * Query params:
 *  - status: Filter by booking status
 *  - email: Filter by customer email
 *  - date: Filter by event date
 *  - limit: Limit the number of results
 *  - offset: Offset for pagination
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      email: req.query.email,
      date: req.query.date,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const bookings = await bookingData.getAllBookings(filters);
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error('Error retrieving bookings:', { error, filters });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
});

/**
 * Update a booking
 * PUT /api/bookings/:id
 */
router.put('/:id', async (req, res) => {
  try {
    // Check if booking exists
    const existingBooking = await bookingData.getBookingById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        error: 'not_found'
      });
    }

    // If the booking date/time changed, check calendar availability
    if (
      req.body.eventDate || 
      req.body.startTime || 
      req.body.endTime
    ) {
      try {
        // Get values to check (either new values or existing values)
        const dateToCheck = req.body.eventDate || existingBooking.eventDate;
        const startTimeToCheck = req.body.startTime || existingBooking.startTime;
        const endTimeToCheck = req.body.endTime || existingBooking.endTime;
        
        const { available, conflicts } = await calendarService.checkAvailability(
          dateToCheck,
          startTimeToCheck,
          endTimeToCheck,
          req.params.id // Exclude this booking from conflict check
        );
        
        if (!available) {
          return res.status(409).json({
            success: false,
            message: 'The requested time slot is not available',
            error: 'time_conflict',
            conflicts
          });
        }
      } catch (calendarError) {
        logger.error('Error checking calendar availability:', { 
          error: calendarError,
          bookingId: req.params.id,
          date: dateToCheck,
          startTime: startTimeToCheck,
          endTime: endTimeToCheck 
        });
        // Continue with update even if calendar check fails
      }
    }

    // Update the booking
    const booking = await bookingData.updateBooking(req.params.id, req.body);
    
    // Update Google Calendar event if one exists
    try {
      // Find event ID, either from the update data or from existing booking
      const eventId = booking.calendar_event_id || existingBooking.calendar_event_id;
      
      if (eventId) {
        await calendarService.updateBookingEvent(eventId, booking);
      } else {
        // If no event exists, try to create one
        const calendarEvent = await calendarService.createBookingEvent(booking);
        if (calendarEvent && calendarEvent.id) {
          await bookingData.updateBooking(booking.id, {
            calendar_event_id: calendarEvent.id
          });
        }
      }
    } catch (calendarError) {
      logger.error('Failed to update calendar event:', { 
        error: calendarError, 
        bookingId: booking.id,
        eventId: eventId 
      });
      // Don't fail the booking update if calendar fails
    }
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error updating booking:', { error, id: req.params.id });
    // Check if it's a validation error
    if (error.message.includes('Validation error')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'validation_error'
      });
    }
    // Database or other errors
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
});

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 * Body: { status: 'confirmed' | 'cancelled' | 'completed' | 'pending' }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !Object.values(BOOKING_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status',
        error: 'invalid_status'
      });
    }

    // Check if booking exists
    const existingBooking = await bookingData.getBookingById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        error: 'not_found'
      });
    }

    const booking = await bookingData.updateBookingStatus(req.params.id, status);
    
    // Update calendar event status if one exists
    try {
      if (booking.calendar_event_id) {
        await calendarService.updateBookingEvent(booking.calendar_event_id, booking);
      }
    } catch (calendarError) {
      logger.error('Failed to update calendar event status:', { 
        error: calendarError, 
        bookingId: booking.id,
        eventId: booking.calendar_event_id,
        status: status 
      });
      // Don't fail the status update if calendar fails
    }
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error updating booking status:', { error, id: req.params.id, status: req.body.status });
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

/**
 * Delete a booking
 * DELETE /api/bookings/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if booking exists
    const existingBooking = await bookingData.getBookingById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        error: 'not_found'
      });
    }

    // Delete calendar event if one exists
    try {
      if (existingBooking.calendar_event_id) {
        await calendarService.deleteBookingEvent(existingBooking.calendar_event_id);
      }
    } catch (calendarError) {
      logger.error('Failed to delete calendar event:', { 
        error: calendarError,
        bookingId: req.params.id,
        eventId: existingBooking.calendar_event_id 
      });
      // Don't fail the booking deletion if calendar deletion fails
    }
    
    await bookingData.deleteBooking(req.params.id);
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting booking:', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
});

/**
 * Check date availability
 * GET /api/bookings/availability/check
 * Query params:
 *  - date: Date to check (YYYY-MM-DD)
 *  - startTime: Start time (HH:MM)
 *  - endTime: End time (HH:MM)
 *  - excludeId: Optional booking ID to exclude from check (for updates)
 */
router.get('/availability/check', async (req, res) => {
  try {
    const { date, startTime, endTime, excludeId } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required',
        error: 'missing_parameters'
      });
    }

    // Check database availability
    const dbAvailable = await bookingData.checkDateAvailability(
      date, 
      startTime, 
      endTime, 
      excludeId
    );
    
    // If not available in DB, no need to check calendar
    if (!dbAvailable) {
      return res.json({
        success: true,
        available: false,
        source: 'database'
      });
    }
    
    // Check calendar availability
    try {
      const { available, conflicts } = await calendarService.checkAvailability(
        date,
        startTime,
        endTime,
        excludeId
      );
      
      res.json({
        success: true,
        available: available,
        source: 'calendar',
        conflicts: conflicts.length > 0 ? conflicts : undefined
      });
    } catch (calendarError) {
      logger.error('Error checking calendar availability:', { 
        error: calendarError,
        date,
        startTime,
        endTime,
        excludeId 
      });
      
      // Fall back to database result if calendar check fails
      res.json({
        success: true,
        available: dbAvailable,
        source: 'database_fallback',
        error: calendarError.message
      });
    }
  } catch (error) {
    logger.error('Error checking availability:', { error, date, startTime, endTime });
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
});

/**
 * Get upcoming bookings
 * GET /api/bookings/upcoming
 * Query params:
 *  - limit: Limit the number of results (default: 10)
 *  - source: 'db' (database only) or 'calendar' (include calendar events) - default: 'db'
 */
router.get('/upcoming/list', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const source = req.query.source || 'db';
    
    // Get bookings from database
    const bookings = await bookingData.getUpcomingBookings(limit);
    
    // If calendar source is requested, get and merge calendar events
    if (source === 'calendar') {
      try {
        const events = await calendarService.getUpcomingEvents(30); // 30 days ahead
        
        // Add calendar-only events (not in our database) to the response
        const calendarOnlyEvents = events
          .filter(event => {
            // Only include events without a booking ID or whose booking ID doesn't match any DB booking
            if (!event.extendedProperties?.private?.bookingId) return true;
            const bookingId = event.extendedProperties.private.bookingId;
            return !bookings.some(booking => booking.id === bookingId);
          })
          .map(event => ({
            id: null, // No database ID
            calendar_event_id: event.id,
            eventDate: event.start.dateTime ? new Date(event.start.dateTime).toISOString().split('T')[0] : null,
            startTime: event.start.dateTime ? new Date(event.start.dateTime).toISOString().split('T')[1].substring(0, 5) : null,
            endTime: event.end.dateTime ? new Date(event.end.dateTime).toISOString().split('T')[1].substring(0, 5) : null,
            fullName: event.summary.replace('Bounce Boss Event: ', '') || 'Unknown',
            status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
            type: 'calendar_only'
          }));
        
        res.json({
          success: true,
          count: bookings.length + calendarOnlyEvents.length,
          data: [...bookings, ...calendarOnlyEvents],
          sources: ['database', 'calendar']
        });
        return;
      } catch (calendarError) {
        logger.error('Error retrieving calendar events:', { error: calendarError });
        // Fall back to database only if calendar fails
      }
    }
    
    // Return database bookings only
    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
      sources: ['database']
    });
  } catch (error) {
    logger.error('Error retrieving upcoming bookings:', { error, limit, source });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve upcoming bookings',
      error: error.message
    });
  }
});

/**
 * Get bookings by date range
 * GET /api/bookings/range
 * Query params:
 *  - startDate: Start date (YYYY-MM-DD)
 *  - endDate: End date (YYYY-MM-DD)
 */
router.get('/range/dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        error: 'missing_parameters'
      });
    }

    const bookings = await bookingData.getBookingsByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error('Error retrieving bookings by date range:', { error, startDate, endDate });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings by date range',
      error: error.message
    });
  }
});

/**
 * Update payment information for a booking 
 * (useful for connecting with Stripe webhook)
 * PATCH /api/bookings/:id/payment
 */
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_amount, payment_id, payment_date, payment_details } = req.body;
    
    // Validate payment status
    if (payment_status && !Object.values(PAYMENT_STATUSES).includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
        error: 'invalid_payment_status'
      });
    }

    // Check if booking exists
    const existingBooking = await bookingData.getBookingById(id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        error: 'not_found'
      });
    }

    // Update payment information
    const updateData = {
      payment_status: payment_status,
      payment_amount: payment_amount,
      payment_id: payment_id,
      payment_date: payment_date || new Date().toISOString()
    };

    const booking = await bookingData.updateBooking(id, updateData);
    
    // If payment is successful (payment_status is 'paid'), send receipt email
    if (payment_status === PAYMENT_STATUSES.PAID && booking.email) {
      try {
        // If payment_details is provided, use it, otherwise create a simple payment object
        const paymentInfo = payment_details || {
          id: payment_id,
          amount: payment_amount,
          created: payment_date || new Date().toISOString(),
          payment_method_details: {
            card: {
              brand: 'Card',
              last4: '****'
            }
          }
        };
        
        await emailService.sendPaymentReceiptEmail(booking, paymentInfo, booking.email);
      } catch (emailError) {
        logger.error('Failed to send payment receipt email:', { 
          error: emailError,
          bookingId: booking.id,
          email: booking.email 
        });
        // Don't fail the payment update if email fails
      }
    }
    
    res.json({
      success: true,
      message: 'Payment information updated successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error updating payment information:', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to update payment information',
      error: error.message
    });
  }
});

module.exports = router;
