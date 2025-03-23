/**
 * Booking Data Layer
 * Handles all database operations for bookings
 */

const supabase = require('../config/supabase');
const { 
  bookingSchema, 
  bookingUpdateSchema, 
  validatePrices, 
  validateTimes,
  BOOKING_STATUSES 
} = require('../models/booking');

// Table name for bookings
const BOOKINGS_TABLE = 'bookings';

/**
 * Creates a new booking in the database
 * @param {Object} bookingData - The booking data to create
 * @returns {Promise<Object>} The created booking
 * @throws {Error} If validation fails or database error occurs
 */
async function createBooking(bookingData) {
  try {
    // Validate booking data against schema
    const { error: validationError } = bookingSchema.validate(bookingData, { abortEarly: false });
    if (validationError) {
      const errorMessage = validationError.details.map(detail => detail.message).join('; ');
      throw new Error(`Validation error: ${errorMessage}`);
    }

    // Perform additional validations
    const priceValidation = validatePrices(bookingData);
    if (!priceValidation.valid) {
      throw new Error(`Validation error: ${priceValidation.error}`);
    }

    const timeValidation = validateTimes(bookingData);
    if (!timeValidation.valid) {
      throw new Error(`Validation error: ${timeValidation.error}`);
    }

    // Convert products array to JSONB format
    const formattedData = {
      ...bookingData,
      products: JSON.stringify(bookingData.products),
      // Add timestamp for terms acceptance if accepted
      terms_accepted_at: bookingData.terms_accepted ? new Date().toISOString() : null
    };

    // Insert booking into database
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .insert(formattedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
}

/**
 * Gets a booking by its ID
 * @param {string} id - The booking ID (UUID)
 * @returns {Promise<Object|null>} The booking or null if not found
 * @throws {Error} If database error occurs
 */
async function getBookingById(id) {
  try {
    if (!id) {
      throw new Error('Booking ID is required');
    }

    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If error is not found, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting booking by ID:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field if it exists
    if (data && data.products) {
      try {
        data.products = JSON.parse(data.products);
      } catch (parseError) {
        console.warn('Could not parse products JSON:', parseError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in getBookingById:', error);
    throw error;
  }
}

/**
 * Gets all bookings with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} filters.status - Filter by booking status
 * @param {string} filters.email - Filter by customer email
 * @param {string} filters.date - Filter by event date (ISO format)
 * @param {number} filters.limit - Limit the number of results
 * @param {number} filters.offset - Offset for pagination
 * @returns {Promise<Array>} Array of bookings
 * @throws {Error} If database error occurs
 */
async function getAllBookings(filters = {}) {
  try {
    // Start building the query
    let query = supabase
      .from(BOOKINGS_TABLE)
      .select('*');
    
    // Apply filters if provided
    if (filters.status) {
      query = query.eq('booking_status', filters.status);
    }
    
    if (filters.email) {
      query = query.eq('customer_email', filters.email);
    }
    
    if (filters.date) {
      query = query.eq('event_date', filters.date);
    }

    // Apply sorting - default to newest first
    query = query.order('created_at', { ascending: false });
    
    // Apply pagination if provided
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error getting all bookings:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field for each booking
    return data.map(booking => {
      if (booking.products) {
        try {
          booking.products = JSON.parse(booking.products);
        } catch (parseError) {
          console.warn(`Could not parse products JSON for booking ${booking.id}:`, parseError);
        }
      }
      return booking;
    });
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    throw error;
  }
}

/**
 * Updates an existing booking
 * @param {string} id - The booking ID (UUID)
 * @param {Object} bookingData - The booking data to update
 * @returns {Promise<Object>} The updated booking
 * @throws {Error} If validation fails or database error occurs
 */
async function updateBooking(id, bookingData) {
  try {
    if (!id) {
      throw new Error('Booking ID is required');
    }

    // Validate booking data against update schema
    const { error: validationError } = bookingUpdateSchema.validate(bookingData, { abortEarly: false });
    if (validationError) {
      const errorMessage = validationError.details.map(detail => detail.message).join('; ');
      throw new Error(`Validation error: ${errorMessage}`);
    }

    // Perform additional validations if prices are being updated
    if (bookingData.products && bookingData.subtotal && bookingData.total) {
      const priceValidation = validatePrices(bookingData);
      if (!priceValidation.valid) {
        throw new Error(`Validation error: ${priceValidation.error}`);
      }
    }

    // Perform time validations if times are being updated
    if (bookingData.event_start_time && bookingData.event_end_time) {
      const timeValidation = validateTimes(bookingData);
      if (!timeValidation.valid) {
        throw new Error(`Validation error: ${timeValidation.error}`);
      }
    }

    // Format data for update
    const updateData = { ...bookingData };
    
    // Convert products array to JSONB if it exists
    if (updateData.products) {
      updateData.products = JSON.stringify(updateData.products);
    }

    // Update terms_accepted_at if terms_accepted is being updated to true
    if (updateData.terms_accepted === true) {
      updateData.terms_accepted_at = new Date().toISOString();
    }

    // Update the booking in the database
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field
    if (data && data.products) {
      try {
        data.products = JSON.parse(data.products);
      } catch (parseError) {
        console.warn('Could not parse products JSON:', parseError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in updateBooking:', error);
    throw error;
  }
}

/**
 * Deletes a booking by ID
 * @param {string} id - The booking ID (UUID)
 * @returns {Promise<boolean>} True if deleted successfully
 * @throws {Error} If database error occurs
 */
async function deleteBooking(id) {
  try {
    if (!id) {
      throw new Error('Booking ID is required');
    }

    const { error } = await supabase
      .from(BOOKINGS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBooking:', error);
    throw error;
  }
}

/**
 * Updates booking status
 * @param {string} id - The booking ID (UUID)
 * @param {string} status - The new status
 * @returns {Promise<Object>} The updated booking
 * @throws {Error} If validation fails or database error occurs
 */
async function updateBookingStatus(id, status) {
  try {
    if (!id) {
      throw new Error('Booking ID is required');
    }

    if (!Object.values(BOOKING_STATUSES).includes(status)) {
      throw new Error(`Invalid booking status: ${status}`);
    }

    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .update({ booking_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field
    if (data && data.products) {
      try {
        data.products = JSON.parse(data.products);
      } catch (parseError) {
        console.warn('Could not parse products JSON:', parseError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    throw error;
  }
}

/**
 * Checks if a date is available (no bookings overlap)
 * @param {string} date - Date to check in ISO format (YYYY-MM-DD)
 * @param {string} startTime - Start time in format HH:MM
 * @param {string} endTime - End time in format HH:MM
 * @param {string} [excludeId] - Optional booking ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if date is available
 * @throws {Error} If database error occurs
 */
async function checkDateAvailability(date, startTime, endTime, excludeId = null) {
  try {
    if (!date || !startTime || !endTime) {
      throw new Error('Date, start time, and end time are required');
    }

    // Create query to find overlapping bookings
    let query = supabase
      .from(BOOKINGS_TABLE)
      .select('id, event_date, event_start_time, event_end_time')
      .eq('event_date', date)
      // Exclude cancelled bookings
      .not('booking_status', 'eq', BOOKING_STATUSES.CANCELLED);
    
    // If excludeId is provided, exclude that booking from the check
    if (excludeId) {
      query = query.not('id', 'eq', excludeId);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error checking date availability:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // If no bookings on this date, it's available
    if (!data || data.length === 0) {
      return true;
    }

    // Convert times to minutes for easier comparison
    const requestStartMinutes = timeToMinutes(startTime);
    const requestEndMinutes = timeToMinutes(endTime);

    // Check if any existing booking overlaps with the requested time slot
    for (const booking of data) {
      const bookingStartMinutes = timeToMinutes(booking.event_start_time);
      const bookingEndMinutes = timeToMinutes(booking.event_end_time);

      // Check for overlap
      if (
        (requestStartMinutes >= bookingStartMinutes && requestStartMinutes < bookingEndMinutes) ||
        (requestEndMinutes > bookingStartMinutes && requestEndMinutes <= bookingEndMinutes) ||
        (requestStartMinutes <= bookingStartMinutes && requestEndMinutes >= bookingEndMinutes)
      ) {
        // There is an overlap
        return false;
      }
    }

    // No overlaps found
    return true;
  } catch (error) {
    console.error('Error in checkDateAvailability:', error);
    throw error;
  }
}

/**
 * Converts time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time string in format HH:MM or HH:MM:SS
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

/**
 * Gets all upcoming bookings
 * @param {number} limit - Limit the number of results
 * @returns {Promise<Array>} Array of upcoming bookings
 * @throws {Error} If database error occurs
 */
async function getUpcomingBookings(limit = 10) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select('*')
      .gte('event_date', today)
      .not('booking_status', 'eq', BOOKING_STATUSES.CANCELLED)
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error getting upcoming bookings:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field for each booking
    return data.map(booking => {
      if (booking.products) {
        try {
          booking.products = JSON.parse(booking.products);
        } catch (parseError) {
          console.warn(`Could not parse products JSON for booking ${booking.id}:`, parseError);
        }
      }
      return booking;
    });
  } catch (error) {
    console.error('Error in getUpcomingBookings:', error);
    throw error;
  }
}

/**
 * Gets bookings for a specific date range
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of bookings in the date range
 * @throws {Error} If database error occurs
 */
async function getBookingsByDateRange(startDate, endDate) {
  try {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error getting bookings by date range:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Parse the products JSONB field for each booking
    return data.map(booking => {
      if (booking.products) {
        try {
          booking.products = JSON.parse(booking.products);
        } catch (parseError) {
          console.warn(`Could not parse products JSON for booking ${booking.id}:`, parseError);
        }
      }
      return booking;
    });
  } catch (error) {
    console.error('Error in getBookingsByDateRange:', error);
    throw error;
  }
}

module.exports = {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  checkDateAvailability,
  getUpcomingBookings,
  getBookingsByDateRange
};
