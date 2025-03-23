/**
 * Test Routes - For testing error handling and logging
 * These routes are for development use only and should be disabled in production
 */
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { 
  ValidationError, 
  DatabaseError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentError 
} = require('../utils/errors');
const { withRetry, retryPredicates } = require('../utils/retry');

/**
 * Test route for different error types
 * GET /api/test/error/:type
 */
router.get('/error/:type', (req, res) => {
  const errorType = req.params.type;
  
  logger.info('Testing error handling', { type: errorType });
  
  try {
    switch(errorType) {
      case 'validation':
        throw new ValidationError('Test validation error', [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Valid email is required' }
        ]);
      
      case 'database':
        const originalDbError = new Error('Database connection error');
        originalDbError.code = 'ECONNREFUSED';
        throw new DatabaseError('Test database error', originalDbError);
      
      case 'auth':
        throw new AuthenticationError('Test authentication error');
      
      case 'access':
        throw new AuthorizationError('Test authorization error');
      
      case 'notfound':
        throw new NotFoundError('Test resource not found');
      
      case 'payment':
        throw new PaymentError('Test payment error', { code: 'card_declined' });
      
      case 'unhandled':
        // This will trigger the unhandled error middleware
        throw new Error('Unhandled server error for testing');
      
      default:
        return res.json({
          success: true,
          message: 'Test route working correctly',
          errorTypes: [
            'validation', 'database', 'auth', 'access', 
            'notfound', 'payment', 'unhandled'
          ]
        });
    }
  } catch (error) {
    // The error will be passed to the error handling middleware
    throw error;
  }
});

/**
 * Test route for retry mechanism
 * GET /api/test/retry/:outcome/:attempts
 */
router.get('/retry/:outcome/:attempts', async (req, res) => {
  try {
    const outcome = req.params.outcome; // 'success' or 'failure'
    const attempts = parseInt(req.params.attempts) || 3;
    
    logger.info('Testing retry mechanism', { outcome, attempts });
    
    const result = await withRetry(
      async () => {
        // Count attempts using a module-level variable
        router.attemptCount = (router.attemptCount || 0) + 1;
        
        if (outcome === 'success' && router.attemptCount >= attempts) {
          // Succeed after specified attempts
          const retryInfo = { 
            success: true, 
            message: `Success after ${router.attemptCount} attempts`,
            attempts: router.attemptCount 
          };
          
          // Reset for next test
          router.attemptCount = 0;
          return retryInfo;
        } else {
          // Simulate a temporary network error
          const error = new Error('Temporary network error for testing');
          error.code = 'ECONNRESET';
          throw error;
        }
      },
      {
        maxRetries: 5,
        initialDelay: 500, // 0.5 seconds for testing
        maxDelay: 2000, // 2 seconds max
        shouldRetry: retryPredicates.networkErrors,
      }
    );
    
    res.json({
      success: true,
      result,
      outcome,
      attemptsRequested: attempts
    });
  } catch (error) {
    // Reset for next test
    router.attemptCount = 0;
    
    logger.error('Retry test failed', { error });
    
    res.status(500).json({
      success: false,
      message: error.message,
      outcome: req.params.outcome,
      attemptsRequested: parseInt(req.params.attempts) || 3,
      attemptsActual: router.attemptCount || 0
    });
  }
});

/**
 * Test route for logging
 * GET /api/test/log/:level
 */
router.get('/log/:level', (req, res) => {
  const level = req.params.level.toLowerCase();
  const validLevels = ['error', 'warn', 'info', 'debug'];
  
  if (!validLevels.includes(level)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid log level',
      validLevels
    });
  }
  
  const message = `Test ${level} log message`;
  const meta = {
    test: true,
    time: new Date().toISOString(),
    random: Math.floor(Math.random() * 1000)
  };
  
  logger[level](message, meta);
  
  res.json({
    success: true,
    message: `${level} message logged successfully`,
    logMessage: message,
    logMeta: meta
  });
});

// Only expose these routes in development
if (process.env.NODE_ENV !== 'production') {
  module.exports = router;
} else {
  // In production, all routes will return 404
  const emptyRouter = express.Router();
  emptyRouter.all('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Test routes are not available in production'
    });
  });
  module.exports = emptyRouter;
}
