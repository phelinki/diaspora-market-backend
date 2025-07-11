const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// TEMPORARY - Allow all origins for debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// More lenient rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased significantly
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

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
    cors: 'enabled-all-origins'
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
app.use('/api/business', businessRegistrationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Diaspora Market API Server',
    version: '1.0.0',
    status: 'Online',
    cors: 'all-origins-allowed'
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
