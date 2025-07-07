const express = require('express');
const router = express.Router();

// Sample businesses data
const sampleBusinesses = [
  {
    id: 1,
    name: "Mama Kuku's Kitchen",
    category: "Restaurant",
    location: "Atlanta, GA",
    rating: 4.8,
    reviews: 127,
    phone: "+1-404-555-0123",
    email: "info@mamakukus.com",
    website: "www.mamakukus.com",
    description: "Authentic Liberian cuisine in the heart of Atlanta",
    image: "🍲"
  },
  {
    id: 2,
    name: "Liberty Hair Salon",
    category: "Beauty",
    location: "Brooklyn, NY",
    rating: 4.6,
    reviews: 89,
    phone: "+1-718-555-0456",
    email: "contact@libertyhair.com",
    website: "www.libertyhair.com",
    description: "Professional hair styling and braiding services",
    image: "💇‍♀️"
  }
];

// Sample services data
const sampleServices = [
  {
    id: 1,
    name: "John Karpeh",
    skill: "Web Development",
    location: "Washington, DC",
    rating: 4.9,
    hourlyRate: 45,
    availability: "Available",
    description: "Full-stack developer with 5+ years experience",
    image: "👨‍💻"
  },
  {
    id: 2,
    name: "Sarah Gbala",
    skill: "Graphic Design",
    location: "Los Angeles, CA",
    rating: 4.7,
    hourlyRate: 35,
    availability: "Available",
    description: "Creative designer specializing in brand identity",
    image: "🎨"
  }
];

// Get all businesses
router.get('/businesses', (req, res) => {
  console.log('GET /businesses called');
  res.json({
    success: true,
    data: sampleBusinesses,
    count: sampleBusinesses.length
  });
});

// Get all services
router.get('/services', (req, res) => {
  console.log('GET /services called');
  res.json({
    success: true,
    data: sampleServices,
    count: sampleServices.length
  });
});

// Add a new business
router.post('/businesses', (req, res) => {
  const newBusiness = {
    id: Date.now(),
    ...req.body,
    rating: 0,
    reviews: 0
  };
  
  sampleBusinesses.push(newBusiness);
  
  res.status(201).json({
    success: true,
    data: newBusiness,
    message: 'Business added successfully'
  });
});

module.exports = router;
