const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// More lenient rate limiting for business registration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Special rate limit for business registration (more lenient)
const businessRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Allow 50 business registrations per 15 minutes
  message: 'Too many business registrations, please try again later.',
});

// CORS configuration - UPDATED
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
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
    console.log('🌍 CORS Request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      console.log('📋 CORS: Allowed origins:', allowedOrigins);
      // TEMPORARILY allow all origins for debugging
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const businessManagementRoutes = require('./routes/business-management');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const businessRegistrationRoutes = require('./routes/business-registration');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', testRoutes);
app.use('/api/business', businessManagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/business', businessRegistrationLimiter, businessRegistrationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Diaspora Market API Server',
    version: '1.0.0',
    status: 'Online',
    cors: 'enabled'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
