const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// CORS configuration - ADD YOUR DOMAINS HERE
const allowedOrigins = [
  'http://localhost:5173',
  'https://diasporamarket.vercel.app',
  'https://diaspora-market.vercel.app', 
  'https://diasporamarket.it.com',
  'https://www.diasporamarket.it.com',
  'https://libprofessionals.com',
  'https://www.libprofessionals.com',
  'https://libprofessionals.vercel.app',
  'http://192.168.4.48:5173',
  'exp://192.168.4.48:19000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, true); // Allow all for now during development
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const businessManagementRoutes = require('./routes/business-management');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', testRoutes);
app.use('/api/business', businessManagementRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Diaspora Market API Server',
    version: '1.0.0',
    status: 'Online'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
