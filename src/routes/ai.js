const express = require('express');
const router = express.Router();

// Mock AI suggestions (in production, integrate with OpenAI, Claude, or custom AI)
const generateBusinessSuggestions = (businessName, category) => {
  const suggestions = [];

  // Description suggestions based on category
  const categoryDescriptions = {
    'Restaurant & Food': [
      'Authentic cuisine that brings the taste of home to your community',
      'Fresh, locally-sourced ingredients prepared with traditional recipes',
      'Family-owned restaurant serving traditional dishes in a warm, welcoming atmosphere'
    ],
    'Hair & Beauty': [
      'Professional hair care services specializing in natural hair textures',
      'Expert braiding and styling with years of experience in African hair traditions',
      'Full-service salon offering cuts, color, and styling for all hair types'
    ],
    'Fashion & Clothing': [
      'Custom-tailored clothing blending traditional and contemporary styles',
      'Authentic African fabrics and designs for special occasions and everyday wear',
      'Fashion that celebrates heritage while embracing modern trends'
    ],
    'Construction & Contracting': [
      'Reliable construction services with attention to detail and customer satisfaction',
      'Licensed and insured contractor specializing in residential and commercial projects',
      'Quality craftsmanship backed by years of experience and community trust'
    ],
    'Professional Services': [
      'Expert professional services tailored to the unique needs of our community',
      'Bilingual services providing clear communication and cultural understanding',
      'Trusted advisor helping navigate complex professional challenges'
    ]
  };

  // Add description suggestion
  const categoryDescList = categoryDescriptions[category] || categoryDescriptions['Professional Services'];
  const descSuggestion = categoryDescList[Math.floor(Math.random() * categoryDescList.length)];
  
  suggestions.push({
    type: 'description',
    text: `${descSuggestion} Located in the heart of the community, ${businessName} is committed to excellence and customer satisfaction.`,
    description: `${descSuggestion} Located in the heart of the community, ${businessName} is committed to excellence and customer satisfaction.`
  });

  // Specialty suggestions based on category
  const categorySpecialties = {
    'Restaurant & Food': ['Traditional dishes', 'Catering services', 'Fresh ingredients', 'Family recipes', 'Takeout available'],
    'Hair & Beauty': ['Natural hair care', 'Braiding specialists', 'Hair treatments', 'Styling consultations', 'Wedding services'],
    'Fashion & Clothing': ['Custom tailoring', 'Traditional wear', 'Alterations', 'Wedding attire', 'Fabric sourcing'],
    'Construction & Contracting': ['Home renovation', 'Commercial projects', 'Emergency repairs', 'Free estimates', 'Licensed & insured'],
    'Professional Services': ['Consultations', 'Bilingual services', 'Flexible scheduling', 'Community-focused', 'Experienced team']
  };

  const specialties = categorySpecialties[category] || categorySpecialties['Professional Services'];
  suggestions.push({
    type: 'specialties',
    text: `Recommended specialties: ${specialties.slice(0, 3).join(', ')}`,
    specialties: specialties.slice(0, 3)
  });

  // SEO optimization suggestions
  suggestions.push({
    type: 'seo_tip',
    text: `To improve visibility, include location-specific keywords like "Minneapolis ${category.toLowerCase()}" or "Twin Cities ${category.split(' ')[0].toLowerCase()}" in your description.`
  });

  return suggestions;
};

// Main AI suggestions endpoint
router.post('/business-suggestions', async (req, res) => {
  try {
    const { businessName, category, city = 'Minneapolis' } = req.body;

    if (!businessName || !category) {
      return res.status(400).json({ 
        error: 'Business name and category are required' 
      });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suggestions = generateBusinessSuggestions(businessName, category);

    const response = {
      success: true,
      suggestions,
      processingTime: '1.2s',
      confidence: 0.87,
      metadata: {
        aiModel: 'Diaspora-Business-AI-v1.0',
        timestamp: new Date().toISOString(),
        businessName,
        category,
        city
      }
    };

    console.log('🤖 AI Suggestions generated for:', businessName, category);

    res.json(response);
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI suggestions',
      fallback: {
        suggestions: [{
          type: 'description',
          text: 'Professional service provider committed to excellence and customer satisfaction.'
        }]
      }
    });
  }
});

module.exports = router;
