const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');

// Import error handling and logging utilities
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorLogger, errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

logger.info('Starting server...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Add request ID to each request
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Request logging
app.use(requestLogger);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Get the absolute path to the public directory
const publicPath = path.join(__dirname, '..', 'public');
logger.info('Looking for public directory at: ' + publicPath);

// Check if the public directory exists
if (!fs.existsSync(publicPath)) {
    logger.error('Public directory not found at: ' + publicPath);
    logger.info('Creating public directory...');
    fs.mkdirSync(publicPath, { recursive: true });
}

// Serve static files from the public directory
app.use(express.static(publicPath));
logger.info('Set up static file serving');

// Define routes for specific pages
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/bounce-houses', (req, res) => {
    res.sendFile(path.join(publicPath, 'bounce-houses.html'));
});

app.get('/sky-dancers', (req, res) => {
    res.sendFile(path.join(publicPath, 'sky-dancers.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(publicPath, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(publicPath, 'contact.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(publicPath, 'payment.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin/dashboard.html'));
});

// API Routes
const paymentsRouter = require('./routes/payments');
const bookingRouter = require('./routes/booking');
const authRouter = require('./routes/auth');
const testRouter = require('./routes/test');

// Register API routes
app.use('/api/stripe', paymentsRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/auth', authRouter);

// Test routes - only available in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRouter);
  logger.info('Test routes enabled - available at /api/test');
}

// Error logging middleware
app.use(errorLogger);

// Handle 404 - Page not found (this is reached if no route matches)
app.use(notFoundHandler);

// Error handling middleware (must be after all other middleware and routes)
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
    logger.info('=================================');
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.info(`Serving files from: ${publicPath}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('=================================');
});

// Implement graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds if not closed gracefully
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}
