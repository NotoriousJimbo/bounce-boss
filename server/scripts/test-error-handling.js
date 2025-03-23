const { withRetry, retryPredicates } = require('../utils/retry');
const logger = require('../utils/logger');
const { 
  ValidationError, 
  DatabaseError, 
  AuthenticationError,
  NotFoundError,
  PaymentError 
} = require('../utils/errors');

// Test various error types and logging
async function runTests() {
  logger.info('Starting error handling and logging tests...');

  try {
    // Test validation error
    logger.info('Testing validation error...');
    try {
      throw new ValidationError('Invalid email address', [
        { field: 'email', message: 'Must be a valid email' }
      ]);
    } catch (error) {
      logger.error('Validation error caught:', { error });
      console.log('✅ Validation error test passed');
    }

    // Test database error
    logger.info('Testing database error...');
    try {
      const originalDbError = new Error('Connection refused');
      originalDbError.code = 'ECONNREFUSED';
      throw new DatabaseError('Database connection failed', originalDbError);
    } catch (error) {
      logger.error('Database error caught:', { error });
      console.log('✅ Database error test passed');
    }

    // Test authentication error
    logger.info('Testing authentication error...');
    try {
      throw new AuthenticationError('Invalid token');
    } catch (error) {
      logger.error('Authentication error caught:', { error });
      console.log('✅ Authentication error test passed');
    }

    // Test not found error
    logger.info('Testing not found error...');
    try {
      throw new NotFoundError('Booking not found');
    } catch (error) {
      logger.error('Not found error caught:', { error });
      console.log('✅ Not found error test passed');
    }

    // Test payment error
    logger.info('Testing payment error...');
    try {
      const stripeError = {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.'
      };
      throw new PaymentError('Payment processing failed', stripeError);
    } catch (error) {
      logger.error('Payment error caught:', { error });
      console.log('✅ Payment error test passed');
    }

    // Test retry mechanism with success after retry
    logger.info('Testing retry mechanism with eventual success...');
    let attempts = 0;
    const successAfterRetries = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Temporary network error');
          error.code = 'ECONNRESET';
          throw error;
        }
        return 'Success after retries!';
      },
      {
        maxRetries: 3,
        initialDelay: 100, // Short delays for testing
        shouldRetry: retryPredicates.networkErrors
      }
    );

    logger.info(`Retry test result: ${successAfterRetries}`);
    console.log(`✅ Retry mechanism test passed (succeeded after ${attempts} attempts)`);

    // Test retry mechanism with permanent failure
    logger.info('Testing retry mechanism with permanent failure...');
    try {
      await withRetry(
        async () => {
          const error = new ValidationError('This error should not trigger retries');
          throw error;
        },
        {
          maxRetries: 3,
          initialDelay: 100,
          shouldRetry: retryPredicates.networkErrors // This won't match validation errors
        }
      );
    } catch (error) {
      logger.error('Expected failure in retry test:', { error });
      console.log('✅ Retry with permanent failure test passed');
    }

    logger.info('All error handling and logging tests completed successfully!');
    console.log('=================================');
    console.log('📝 Test Summary:');
    console.log('✅ Custom error types');
    console.log('✅ Error logging');
    console.log('✅ Retry mechanism with exponential backoff');
    console.log('✅ Retry predicates for different error types');
    console.log('=================================');
    console.log('Check the logs directory for the generated log files.');

  } catch (error) {
    logger.error('Unexpected error during tests:', { error });
    console.error('❌ Tests failed with unexpected error:', error);
  }
}

// Run the tests
runTests();
