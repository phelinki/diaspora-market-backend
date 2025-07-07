const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Import sample businesses from test.js (in real app, this would be database)
const testRoutes = require('./test');
// We'll need to make the businesses array accessible

// Get business owner's business
router.get('/my-business', authenticateToken, requireRole(['business_owner']), (req, res) => {
  // In real app, query database by user's businessId
  const userBusinessId = req.user.businessId;
  
  // For now, return mock data
  const mockBusiness = {
    id: userBusinessId || 1,
    name: "My Demo Business",
    category: "Technology",
    location: "Atlanta, GA",
    rating: 4.5,
    reviews: 25,
    phone: "+1-555-0123",
    email: req.user.email,
    website: "www.mydemo.com",
    description: "This is my business description",
    image: "🏢",
    verified: true,
    owner: req.user.email
  };

  res.json({
    success: true,
    business: mockBusiness
  });
});

// Update business owner's business
router.put('/my-business', authenticateToken, requireRole(['business_owner']), (req, res) => {
  try {
    const { name, category, location, phone, email, website, description } = req.body;
    
    // In real app, update database
    const updatedBusiness = {
      id: req.user.businessId || 1,
      name: name || "Updated Business Name",
      category: category || "Technology",
      location: location || "Atlanta, GA",
      phone: phone || "+1-555-0123",
      email: email || req.user.email,
      website: website || "",
      description: description || "Updated description",
      rating: 4.5,
      reviews: 25,
      image: "🏢",
      verified: true,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Business updated successfully',
      business: updatedBusiness
    });

  } catch (error) {
    console.error('Business update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get business analytics/stats
router.get('/analytics', authenticateToken, requireRole(['business_owner']), (req, res) => {
  // Mock analytics data
  const analytics = {
    totalViews: 1250,
    thisMonthViews: 186,
    totalContacts: 45,
    thisMonthContacts: 12,
    averageRating: 4.5,
    totalReviews: 25,
    recentActivity: [
      { date: '2025-01-05', action: 'Profile viewed', count: 15 },
      { date: '2025-01-04', action: 'Contact clicked', count: 3 },
      { date: '2025-01-03', action: 'Profile viewed', count: 22 }
    ]
  };

  res.json({
    success: true,
    analytics
  });
});

module.exports = router;
