const expressWinston = require('express-winston');
const logger = require('../utils/logger');

// Request logging middleware using Winston
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: process.env.NODE_ENV !== 'production',
  // Don't log body for these content types
  ignoreRoute: (req, res) => {
    if (req.path.startsWith('/api/stripe/webhook')) {
      return true; // Don't log Stripe webhook requests to avoid logging sensitive data
    }
    return false;
  },
  dynamicMeta: (req, res) => {
    const meta = {
      requestId: req.id,
      userId: req.user ? req.user.id : null,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // Don't log auth tokens or sensitive data in headers
    if (req.headers && req.headers.authorization) {
      req.headers.authorization = '[FILTERED]';
    }
    
    // Don't log body content for password requests
    if (req.body) {
      if (req.body.password) {
        req.body.password = '[FILTERED]';
      }
      if (req.body.creditCard) {
        req.body.creditCard = '[FILTERED]';
      }
    }
    
    return meta;
  }
});

module.exports = requestLogger;
