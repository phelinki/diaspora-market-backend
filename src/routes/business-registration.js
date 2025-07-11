const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// In-memory business storage (in production, use a proper database)
let businesses = [];

// Register a new business
router.post('/register', authenticateToken, upload.array('businessImages', 5), async (req, res) => {
  try {
    console.log('Business registration attempt:', req.body);
    
    const {
      businessName,
      category,
      subCategory,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      specialties,
      ownerEthnicity,
      businessLicense,
      yearsInBusiness,
      employeeCount,
      acceptsOnlinePayments,
      offersDelivery,
      languages,
      socialMedia,
      operatingHours,
      registrationMetadata
    } = req.body;

    // Parse JSON fields
    const parsedSocialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia;
    const parsedOperatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
    const parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    const parsedMetadata = typeof registrationMetadata === 'string' ? JSON.parse(registrationMetadata) : registrationMetadata;

    // Validate required fields
    if (!businessName || !category || !description || !address || !city || !state || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Process uploaded images (in production, upload to Cloudinary)
    const businessImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        businessImages.push({
          id: `img_${Date.now()}_${index}`,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          // In production, upload to Cloudinary and store URL
          url: `https://via.placeholder.com/400x300/06D6A0/FFFFFF?text=${encodeURIComponent(businessName)}`
        });
      });
    }

    // Create business object
    const newBusiness = {
      id: `business_${Date.now()}`,
      ownerId: req.user.id,
      businessName,
      category,
      subCategory: subCategory || '',
      description,
      address,
      city,
      state,
      zipCode: zipCode || '',
      phone,
      email,
      website: website || '',
      socialMedia: parsedSocialMedia || {},
      specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(s => s) : [],
      ownerEthnicity,
      businessLicense: businessLicense || '',
      yearsInBusiness,
      employeeCount: employeeCount || '',
      operatingHours: parsedOperatingHours || {},
      acceptsOnlinePayments: acceptsOnlinePayments === 'true',
      offersDelivery: offersDelivery === 'true',
      languages: Array.isArray(parsedLanguages) ? parsedLanguages : ['English'],
      businessImages,
      rating: 0,
      reviewCount: 0,
      verified: false,
      featured: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registrationMetadata: parsedMetadata || {}
    };

    // Add to businesses array
    businesses.push(newBusiness);

    console.log('✅ Business registered successfully:', newBusiness.businessName);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      businessId: newBusiness.id,
      business: {
        id: newBusiness.id,
        businessName: newBusiness.businessName,
        category: newBusiness.category,
        status: newBusiness.status
      }
    });

  } catch (error) {
    console.error('Business registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register business',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all businesses (public endpoint)
router.get('/all', async (req, res) => {
  try {
    const { category, city, search, limit = 50 } = req.query;
    
    let filteredBusinesses = [...businesses];

    // Filter by category
    if (category && category !== 'all') {
      filteredBusinesses = filteredBusinesses.filter(b => 
        b.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filter by city
    if (city) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        b.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBusinesses = filteredBusinesses.filter(b => 
        b.businessName.toLowerCase().includes(searchLower) ||
        b.description.toLowerCase().includes(searchLower) ||
        b.specialties.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    // Sort by created date (newest first)
    filteredBusinesses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit results
    const limitedBusinesses = filteredBusinesses.slice(0, parseInt(limit));

    // Format response
    const formattedBusinesses = limitedBusinesses.map(business => ({
      id: business.id,
      name: business.businessName,
      category: business.category,
      subCategory: business.subCategory,
      description: business.description,
      address: business.address,
      city: business.city,
      state: business.state,
      phone: business.phone,
      email: business.email,
      website: business.website,
      specialties: business.specialties,
      ownerEthnicity: business.ownerEthnicity,
      rating: business.rating,
      reviewCount: business.reviewCount,
      image: business.businessImages[0]?.url || 'https://via.placeholder.com/400x300/06D6A0/FFFFFF?text=Business',
      verified: business.verified,
      operatingHours: business.operatingHours,
      languages: business.languages,
      acceptsOnlinePayments: business.acceptsOnlinePayments,
      offersDelivery: business.offersDelivery,
      distance: Math.random() * 10 // Mock distance calculation
    }));

    res.json({
      success: true,
      businesses: formattedBusinesses,
      count: formattedBusinesses.length,
      total: businesses.length
    });

  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses'
    });
  }
});

// Get business by ID
router.get('/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = businesses.find(b => b.id === businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.json({
      success: true,
      business
    });

  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business'
    });
  }
});

module.exports = router;
