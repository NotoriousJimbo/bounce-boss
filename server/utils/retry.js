const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Options for retrying
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if retry should be attempted based on error
 * @param {Function} options.onRetry - Function to call before each retry attempt
 * @returns {Promise<*>} - Result of the function
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry = (err, attempt) => {}
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate backoff delay
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      // Add some jitter to avoid thundering herd problem
      const jitter = Math.random() * 0.3 * delay;
      const backoffDelay = delay + jitter;

      // Log retry attempt
      logger.warn(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(backoffDelay)}ms...`, {
        error: error.message,
        attempt: attempt + 1,
        maxRetries,
        delay: backoffDelay
      });

      // Call onRetry callback
      onRetry(error, attempt + 1);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      attempt++;
    }
  }
  
  // This should not be reached due to the throw above, but just in case
  throw lastError;
}

/**
 * Common predicate functions for retry decisions
 */
const retryPredicates = {
  // Retry on network errors
  networkErrors: (error) => {
    return error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message.includes('network') ||
      error.message.includes('connection');
  },
  
  // Retry on Supabase/PostgreSQL temporary errors
  databaseTemporaryErrors: (error) => {
    // Check for specific PostgreSQL error codes that indicate temporary issues
    const pgTemporaryErrorCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '53100', // disk_full
      '53200', // out_of_memory
      '53300', // too_many_connections
      '57P04', // database_dropped
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '08004', // sqlserver_rejected_establishment_of_sqlconnection
    ];
    
    // Check for specific codes in Supabase errors
    if (error.code && pgTemporaryErrorCodes.includes(error.code)) {
      return true;
    }
    
    // Check for timeout or connection errors in message
    if (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('temporarily unavailable') ||
      error.message.includes('connection') ||
      error.message.includes('rate limit')
    )) {
      return true;
    }
    
    return false;
  },
  
  // Retry on Stripe temporary errors
  stripeTemporaryErrors: (error) => {
    // Stripe error types that are usually temporary
    const stripeTemporaryErrorTypes = [
      'rate_limit_error',
      'api_connection_error',
      'api_error'
    ];
    
    if (error.type && stripeTemporaryErrorTypes.includes(error.type)) {
      return true;
    }
    
    // Stripe status codes that may be temporary
    if (error.statusCode && [429, 500, 502, 503, 504].includes(error.statusCode)) {
      return true;
    }
    
    return false;
  },
  
  // Retry on HTTP 5xx errors (server errors)
  http5xxErrors: (error) => {
    return error.status >= 500 && error.status < 600;
  },
  
  // Retry on rate limiting (HTTP 429)
  rateLimitErrors: (error) => {
    return error.status === 429 || 
           error.statusCode === 429 ||
           (error.message && error.message.includes('rate limit'));
  },
  
  // Create a combined predicate from multiple predicates
  any: (...predicates) => {
    return (error) => predicates.some(predicate => predicate(error));
  }
};

module.exports = {
  withRetry,
  retryPredicates
};
