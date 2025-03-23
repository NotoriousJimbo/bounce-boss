const expressWinston = require('express-winston');
const logger = require('../utils/logger');
const { formatError } = require('../utils/errors');
const path = require('path');

// Error logging middleware
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: '{{err.message}}',
  dumpExceptions: true,
  showStack: true
});

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name || 'Error'}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
    userId: req.user ? req.user.id : null
  });

  // Default to 500 internal server error if status is not set
  const statusCode = err.statusCode || err.status || 500;
  
  // For API requests, return JSON error response
  if (req.path.startsWith('/api')) {
    return res.status(statusCode).json(formatError(err));
  }

  // For HTTP 404 errors, serve the 404 page
  if (statusCode === 404) {
    return res.status(404).sendFile(path.join(__dirname, '../../public/404.html'));
  }

  // For other web page errors, redirect to a friendly error page with error info
  // In production, we might want to hide detailed error messages
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message;

  // In development, show more error details
  if (process.env.NODE_ENV !== 'production') {
    return res.status(statusCode).send(`
      <html>
        <head>
          <title>Error - Bounce Boss</title>
          <style>
            body { font-family: sans-serif; padding: 30px; line-height: 1.6; }
            h1 { color: #e53e3e; }
            pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>Error: ${err.name || 'Server Error'}</h1>
          <p><strong>Status:</strong> ${statusCode}</p>
          <p><strong>Message:</strong> ${err.message}</p>
          <h2>Stack Trace:</h2>
          <pre>${err.stack}</pre>
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
    `);
  }

  // In production, redirect to a generic error page (this should be created)
  res.redirect('/error.html?status=' + statusCode);
};

// Not found (404) middleware
const notFoundHandler = (req, res, next) => {
  logger.warn(`Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, '../../public/404.html'));
};

module.exports = {
  errorLogger,
  errorHandler,
  notFoundHandler
};
