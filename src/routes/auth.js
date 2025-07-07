const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize users with properly hashed passwords
let users = [];

// Helper function to initialize demo users (only run once)
const initializeDemoUsers = async () => {
  if (users.length === 0) {
    const businessPassword = await bcrypt.hash('business123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    
    users = [
      {
        id: 1,
        email: 'demo@business.com',
        password: businessPassword,
        firstName: 'Demo',
        lastName: 'Business',
        country: 'United States',
        city: 'Atlanta',
        role: 'seller',
        phoneNumber: '+1-555-0123',
        emailVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        email: 'customer@example.com',
        password: customerPassword,
        firstName: 'Demo',
        lastName: 'Customer',
        country: 'United States',
        city: 'New York',
        role: 'buyer',
        phoneNumber: '+1-555-0456',
        emailVerified: true,
        createdAt: new Date().toISOString()
      }
    ];
    console.log('Demo users initialized');
  }
};

// Initialize demo users when the module loads
initializeDemoUsers();

// Validation schemas - UPDATED to match frontend
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  role: Joi.string().valid('buyer', 'seller', 'both').required(),
  phoneNumber: Joi.string().optional().allow(''),
  agreeToTerms: Joi.boolean().valid(true).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional()
});

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role
    },
    process.env.JWT_SECRET || 'diaspora-market-secret-2025',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user - UPDATED for frontend compatibility
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body.email);
    
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation error', 
        message: error.details[0].message 
      });
    }

    const { email, password, confirmPassword, firstName, lastName, country, city, role, phoneNumber } = value;

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Passwords don't match" 
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      country,
      city,
      role,
      phoneNumber: phoneNumber || null,
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    console.log('User registered successfully:', email);

    // Generate token
    const token = generateToken(newUser);

    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Login user - UPDATED for frontend compatibility
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error', 
        message: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('Login successful for:', email);

    // Generate token
    const token = generateToken(user);

    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Verify token - NEW endpoint for frontend
router.get('/verify', authenticateToken, (req, res) => {
  const user = users.find(u => u.id.toString() === req.user.id.toString());
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// Debug endpoint to list users (remove in production)
router.get('/debug/users', (req, res) => {
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json({ users: usersWithoutPasswords });
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id.toString() === req.user.id.toString());
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
