# Error Handling & Logging System

This directory contains utilities for centralized error handling, logging, and retry mechanisms in the Bounce Boss application.

## Overview

The system consists of the following components:

1. **Logging System**: Winston-based structured logging with file and console outputs
2. **Custom Error Types**: Standardized error classes for consistent error handling
3. **Error Middleware**: Express middleware for catching, logging, and handling errors
4. **Retry Mechanism**: Utility for retrying operations with exponential backoff

## Usage Guide

### Logging

```javascript
const logger = require('./utils/logger');

// Log levels: error, warn, info, http, verbose, debug, silly
logger.error('Something went wrong', { userId: '123', error });
logger.warn('Something suspicious', { requestId: 'abc123' });
logger.info('Operation completed', { bookingId: '456' });
logger.debug('Debug information', { data: someObject });
```

Logs are saved to the `logs` directory with the following files:
- `error.log`: Contains only error messages
- `combined.log`: Contains all log messages
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled promise rejections

In development mode, logs are also output to the console in a colorized, formatted manner.

### Custom Error Types

```javascript
const { 
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentError 
} = require('./utils/errors');

// Validation error with details
throw new ValidationError('Invalid input', [
  { field: 'email', message: 'Must be a valid email' }
]);

// Database error with original error
try {
  // Database operation
} catch (dbError) {
  throw new DatabaseError('Database operation failed', dbError);
}

// Authentication/Authorization errors
throw new AuthenticationError('Invalid credentials');
throw new AuthorizationError('Insufficient permissions');

// Not found errors
throw new NotFoundError('Booking not found');

// Payment errors
throw new PaymentError('Payment processing failed', stripeError);
```

### Error Formatting

The `formatError` function provides consistent error response formatting:

```javascript
const { formatError } = require('./utils/errors');

// In route handlers
app.get('/api/resource', (req, res) => {
  try {
    // Operation that might fail
  } catch (error) {
    res.status(error.statusCode || 500).json(formatError(error));
  }
});
```

### Retry Mechanism

```javascript
const { withRetry, retryPredicates } = require('./utils/retry');

// Basic retry
const result = await withRetry(
  async () => {
    // Async operation that might fail temporarily
    return await someAsyncOperation();
  },
  {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  }
);

// Retry with custom condition
const result = await withRetry(
  async () => {
    return await stripeOperation();
  },
  {
    maxRetries: 5,
    shouldRetry: retryPredicates.stripeTemporaryErrors,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} after Stripe error`, error);
    }
  }
);

// Combined retry predicates
const customPredicate = retryPredicates.any(
  retryPredicates.networkErrors,
  retryPredicates.http5xxErrors,
  retryPredicates.rateLimitErrors
);
```

## Implementation Details

### Logger (logger.js)

- Uses Winston for structured logging
- Configures multiple transports (console, files)
- Handles log rotation with size limits
- Captures uncaught exceptions and unhandled rejections
- Provides a stream interface for HTTP request logging

### Error Handling (errors.js)

- Defines custom error classes with appropriate status codes
- Provides utility functions for error creation and formatting
- Standardizes error responses for API clients

### Request & Error Middleware

- `requestLogger.js`: Logs all incoming HTTP requests
- `errorHandler.js`: Catches and handles errors, serving appropriate responses

### Retry Utility (retry.js)

- Implements exponential backoff with jitter
- Provides predefined predicates for common error types
- Supports custom retry logic through callbacks

## Testing

Run the test script to verify all error handling and logging components:

```
node server/scripts/test-error-handling.js
```

This will generate sample logs and test various error scenarios and retry mechanisms.
