const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for businesses
let businesses = [];

// Register a new business
router.post('/register', authenticateToken, async (req, res) => {
  try {
    console.log('🏢 Business registration request received');
    console.log('📋 Request body:', req.body);
    console.log('👤 User:', req.user);

    const {
      businessName,
      category,
      description,
      address,
      city,
      state,
      phone,
      email,
      website,
      ownerEthnicity,
      yearsInBusiness
    } = req.body;

    // Validation
    const requiredFields = [
      'businessName',
      'category', 
      'description',
      'address',
      'city',
      'state',
      'phone',
      'email',
      'ownerEthnicity',
      'yearsInBusiness'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Additional validation
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters'
      });
    }

    if (businessName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Business name must be at least 2 characters'
      });
    }

    // Create new business
    const newBusiness = {
      id: Date.now().toString(),
      businessName,
      category,
      description,
      address,
      city,
      state,
      phone,
      email,
      website: website || '',
      ownerEthnicity,
      yearsInBusiness,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      status: 'active',
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    businesses.push(newBusiness);

    console.log('✅ Business registered successfully:', newBusiness.businessName);
    console.log('📊 Total businesses:', businesses.length);

    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      businessId: newBusiness.id,
      business: newBusiness
    });

  } catch (error) {
    console.error('❌ Business registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register business'
    });
  }
});

// Get all businesses (for listing)
router.get('/list', (req, res) => {
  try {
    const activeBusinesses = businesses.filter(b => b.status === 'active');
    
    res.json({
      success: true,
      count: activeBusinesses.length,
      businesses: activeBusinesses
    });
  } catch (error) {
    console.error('❌ Error listing businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list businesses'
    });
  }
});

// Get businesses by owner
router.get('/my-businesses', authenticateToken, (req, res) => {
  try {
    const userBusinesses = businesses.filter(b => b.ownerId === req.user.id);
    
    res.json({
      success: true,
      count: userBusinesses.length,
      businesses: userBusinesses
    });
  } catch (error) {
    console.error('❌ Error getting user businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user businesses'
    });
  }
});

// Debug endpoint to see all businesses
router.get('/debug/all', (req, res) => {
  res.json({
    success: true,
    count: businesses.length,
    businesses: businesses
  });
});

module.exports = router;
