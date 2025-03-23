const createError = require('http-errors');
const logger = require('./logger');

// Custom error classes
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.statusCode = 500;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class PaymentError extends Error {
  constructor(message, stripeError = null) {
    super(message);
    this.name = 'PaymentError';
    this.stripeError = stripeError;
    this.statusCode = 400;
  }
}

// Function to throw appropriate HTTP errors
const throwError = (status, message) => {
  throw createError(status, message);
};

// Function to safely parse JSON with error handling
const safeJsonParse = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.error('JSON Parse Error', { error: error.message, json });
    throw new ValidationError('Invalid JSON format');
  }
};

// Error formatter for consistent error responses
const formatError = (err) => {
  const formattedError = {
    error: {
      message: err.message || 'An unexpected error occurred',
      type: err.name || 'Error'
    }
  };

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    formattedError.error.details = err.errors;
  }

  // Add original error details for debugging (not exposed to client in production)
  if (process.env.NODE_ENV !== 'production' && err.originalError) {
    formattedError.error.originalError = {
      message: err.originalError.message,
      stack: err.originalError.stack
    };
  }

  return formattedError;
};

module.exports = {
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentError,
  throwError,
  safeJsonParse,
  formatError
};
