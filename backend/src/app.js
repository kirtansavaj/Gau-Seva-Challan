const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const challanRoutes = require('./routes/challanRoutes');
const logger = require('./config/logger');

const app = express();

// HTTP Request Logging Middleware (Prints every request to terminal console)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMsg = `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    console.log(logMsg);
    logger.info(logMsg);
  });
  next();
});

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    });
  }
});
app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/challan', challanRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  const errorMsg = `[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`;
  console.error(errorMsg);
  console.error(err.stack);
  logger.error(errorMsg);
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

module.exports = app;
