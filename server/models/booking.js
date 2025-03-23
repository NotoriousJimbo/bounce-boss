/**
 * Booking Model
 * Defines the structure and validation for booking data
 */

// Validation schemas using Joi
const Joi = require('joi');

// Define booking status constants
const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Define payment status constants
const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

// Define venue type constants
const VENUE_TYPES = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  BOTH: 'both'
};

// Validation schema for creating a new booking
const bookingSchema = Joi.object({
  // Customer Information
  customer_first_name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'First name is required',
      'any.required': 'First name is required'
    }),
  customer_last_name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required'
    }),
  customer_email: Joi.string().email().required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  customer_phone: Joi.string().trim().min(7).max(20).required()
    .messages({
      'string.empty': 'Phone number is required',
      'any.required': 'Phone number is required'
    }),
  customer_address: Joi.string().allow('', null),

  // Event Details
  event_date: Joi.date().iso().greater('now').required()
    .messages({
      'date.greater': 'Event date must be in the future',
      'any.required': 'Event date is required'
    }),
  event_start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required()
    .messages({
      'string.pattern.base': 'Start time must be in a valid format (HH:MM)',
      'any.required': 'Start time is required'
    }),
  event_end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required()
    .messages({
      'string.pattern.base': 'End time must be in a valid format (HH:MM)',
      'any.required': 'End time is required'
    }),
  event_address: Joi.string().trim().min(5).max(200).required()
    .messages({
      'string.empty': 'Event address is required',
      'any.required': 'Event address is required'
    }),
  event_city: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'City is required',
      'any.required': 'City is required'
    }),
  event_postal_code: Joi.string().trim().min(5).max(10).required()
    .messages({
      'string.empty': 'Postal code is required',
      'any.required': 'Postal code is required'
    }),
  event_type: Joi.string().allow('', null),
  event_notes: Joi.string().allow('', null),
  indoor_outdoor: Joi.string().valid(VENUE_TYPES.INDOOR, VENUE_TYPES.OUTDOOR, VENUE_TYPES.BOTH).required()
    .messages({
      'any.only': 'Please select a valid venue type (indoor, outdoor, or both)',
      'any.required': 'Venue type is required'
    }),

  // Booking Status (defaults to pending in DB)
  booking_status: Joi.string().valid(
    BOOKING_STATUSES.PENDING,
    BOOKING_STATUSES.CONFIRMED,
    BOOKING_STATUSES.CANCELLED,
    BOOKING_STATUSES.COMPLETED
  ).default(BOOKING_STATUSES.PENDING),

  // Payment Information (defaults in DB)
  payment_status: Joi.string().valid(
    PAYMENT_STATUSES.UNPAID,
    PAYMENT_STATUSES.PARTIAL,
    PAYMENT_STATUSES.PAID,
    PAYMENT_STATUSES.REFUNDED
  ).default(PAYMENT_STATUSES.UNPAID),
  payment_amount: Joi.number().min(0).default(0),
  payment_id: Joi.string().allow('', null),
  payment_date: Joi.date().iso().allow(null),

  // Product & Pricing Information
  products: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().positive().required()
  })).min(1).required()
    .messages({
      'array.min': 'At least one product must be selected',
      'any.required': 'Product selection is required'
    }),
  subtotal: Joi.number().positive().required()
    .messages({
      'number.positive': 'Subtotal must be a positive number',
      'any.required': 'Subtotal is required'
    }),
  tax: Joi.number().min(0).required()
    .messages({
      'number.min': 'Tax cannot be negative',
      'any.required': 'Tax is required'
    }),
  total: Joi.number().positive().required()
    .messages({
      'number.positive': 'Total must be a positive number',
      'any.required': 'Total is required'
    }),
  discount_code: Joi.string().allow('', null),
  discount_amount: Joi.number().min(0).default(0),

  // Terms & Legal
  terms_accepted: Joi.boolean().valid(true).required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'Terms acceptance is required'
    }),
  terms_accepted_at: Joi.date().iso().allow(null),
  ip_address: Joi.string().allow('', null),

  // Additional Information
  referral_source: Joi.string().allow('', null),
  admin_notes: Joi.string().allow('', null)
});

// Validation schema for updating a booking (all fields optional)
const bookingUpdateSchema = Joi.object({
  // Customer Information
  customer_first_name: Joi.string().trim().min(1).max(100),
  customer_last_name: Joi.string().trim().min(1).max(100),
  customer_email: Joi.string().email(),
  customer_phone: Joi.string().trim().min(7).max(20),
  customer_address: Joi.string().allow('', null),

  // Event Details
  event_date: Joi.date().iso().greater('now'),
  event_start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
  event_end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
  event_address: Joi.string().trim().min(5).max(200),
  event_city: Joi.string().trim().min(2).max(100),
  event_postal_code: Joi.string().trim().min(5).max(10),
  event_type: Joi.string().allow('', null),
  event_notes: Joi.string().allow('', null),
  indoor_outdoor: Joi.string().valid(VENUE_TYPES.INDOOR, VENUE_TYPES.OUTDOOR, VENUE_TYPES.BOTH),

  // Booking Status
  booking_status: Joi.string().valid(
    BOOKING_STATUSES.PENDING, 
    BOOKING_STATUSES.CONFIRMED,
    BOOKING_STATUSES.CANCELLED,
    BOOKING_STATUSES.COMPLETED
  ),

  // Payment Information
  payment_status: Joi.string().valid(
    PAYMENT_STATUSES.UNPAID,
    PAYMENT_STATUSES.PARTIAL,
    PAYMENT_STATUSES.PAID,
    PAYMENT_STATUSES.REFUNDED
  ),
  payment_amount: Joi.number().min(0),
  payment_id: Joi.string().allow('', null),
  payment_date: Joi.date().iso().allow(null),

  // Product & Pricing Information
  products: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().positive().required()
  })).min(1),
  subtotal: Joi.number().positive(),
  tax: Joi.number().min(0),
  total: Joi.number().positive(),
  discount_code: Joi.string().allow('', null),
  discount_amount: Joi.number().min(0),

  // Terms & Legal
  terms_accepted: Joi.boolean(),
  terms_accepted_at: Joi.date().iso().allow(null),
  ip_address: Joi.string().allow('', null),

  // Additional Information
  referral_source: Joi.string().allow('', null),
  admin_notes: Joi.string().allow('', null)
});

// Helper function for price validation
function validatePrices(booking) {
  // Calculate expected subtotal from products
  const calculatedSubtotal = booking.products.reduce(
    (total, product) => total + (product.price * product.quantity), 
    0
  );
  
  // Check if provided subtotal matches calculated subtotal
  if (Math.abs(booking.subtotal - calculatedSubtotal) > 0.01) {
    return { 
      valid: false, 
      error: 'Subtotal does not match the sum of product prices'
    };
  }
  
  // Calculate expected total (subtotal + tax - discount)
  const calculatedTotal = booking.subtotal + booking.tax - (booking.discount_amount || 0);
  
  // Check if provided total matches calculated total
  if (Math.abs(booking.total - calculatedTotal) > 0.01) {
    return { 
      valid: false, 
      error: 'Total does not match subtotal + tax - discount'
    };
  }
  
  return { valid: true };
}

// Helper function for time validation
function validateTimes(booking) {
  // Convert time strings to Date objects for comparison
  const startTimeParts = booking.event_start_time.split(':');
  const endTimeParts = booking.event_end_time.split(':');
  
  const startDate = new Date(2000, 0, 1, startTimeParts[0], startTimeParts[1]);
  const endDate = new Date(2000, 0, 1, endTimeParts[0], endTimeParts[1]);
  
  // Check if end time is after start time
  if (endDate <= startDate) {
    return {
      valid: false,
      error: 'End time must be after start time'
    };
  }
  
  // Calculate duration in hours
  const durationHours = (endDate - startDate) / (1000 * 60 * 60);
  
  // Check minimum rental duration (assuming 4 hours is minimum)
  if (durationHours < 4) {
    return {
      valid: false,
      error: 'Minimum rental duration is 4 hours'
    };
  }
  
  return { valid: true };
}

module.exports = {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  VENUE_TYPES,
  bookingSchema,
  bookingUpdateSchema,
  validatePrices,
  validateTimes
};
