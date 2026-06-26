const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// 1. Production Security Middlewares
// ==========================================

// Enable Helmet to secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading uploaded evidence images in React client
}));

// Setup Request Logger (Morgan)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Configure Secure CORS Origin Handling (Avoid origin: "*")
const allowedOrigins = [
  'http://localhost:5173', // Vite local client
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      return callback(null, true);
    } else {
      return callback(new Error('Blocked by CORS policy: Secure origin restricted.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configure API Rate Limiting (Prevents Brute-force and DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Apply rate limiter to all API endpoints
app.use('/api/', apiLimiter);

// Body Parsers with strict sizing limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically with helmet cross-origin allowance
app.use('/uploads', express.static(uploadsDir));

// ==========================================
// 2. Mount API Routes
// ==========================================
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart City Citizen Service Portal Secure REST API is online.',
    env: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint resource not found.' });
});

// Centralized Production Error Handler
app.use((err, req, res, next) => {
  console.error('[Security System Log] Centralized Exception Handled:', err.message);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error. Please contact city systems support.',
    error: NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Smart City Backend Rest Server started!`);
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`Environment Mode: ${NODE_ENV}`);
  console.log(`CORS security origins configured: ${allowedOrigins.join(', ')}`);
  console.log(`=================================================`);
});

module.exports = app;
