const express = require('express');
const router = express.Router();

// In-memory analytics storage (in production, use a proper database)
let analyticsEvents = [];
let businessMetrics = {};

// Track analytics events
router.post('/track', async (req, res) => {
  try {
    const { event, properties } = req.body;
    
    const analyticsEvent = {
      id: Date.now().toString(),
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    };

    analyticsEvents.push(analyticsEvent);
    
    // Update business metrics if this is a business-related event
    if (properties.businessId) {
      if (!businessMetrics[properties.businessId]) {
        businessMetrics[properties.businessId] = {
          views: 0,
          contacts: 0,
          registrations: 0,
          completions: 0
        };
      }

      // Update metrics based on event type
      switch (event) {
        case 'business_listing_viewed':
          businessMetrics[properties.businessId].views++;
          break;
        case 'business_contact_clicked':
          businessMetrics[properties.businessId].contacts++;
          break;
        case 'business_registration_started':
          businessMetrics[properties.businessId].registrations++;
          break;
        case 'business_registration_completed':
          businessMetrics[properties.businessId].completions++;
          break;
      }
    }

    console.log('📊 Analytics Event:', event, properties);

    res.json({ success: true, eventId: analyticsEvent.id });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get analytics dashboard data
router.get('/dashboard/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Filter events for this business and timeframe
    const businessEvents = analyticsEvents.filter(event => 
      event.properties.businessId === businessId &&
      new Date(event.properties.timestamp) >= startDate &&
      new Date(event.properties.timestamp) <= endDate
    );

    // Aggregate metrics
    const metrics = {
      totalViews: businessEvents.filter(e => e.event === 'business_listing_viewed').length,
      totalContacts: businessEvents.filter(e => e.event === 'business_contact_clicked').length,
      totalClicks: businessEvents.filter(e => e.event.includes('clicked')).length,
      avgTimeOnPage: calculateAverageTime(businessEvents),
      topSources: getTopSources(businessEvents),
      dailyViews: getDailyViews(businessEvents, startDate, endDate),
      popularTimes: getPopularTimes(businessEvents),
      searchKeywords: getSearchKeywords(businessEvents)
    };

    res.json({ success: true, metrics, timeframe });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// Get platform-wide analytics (admin only)
router.get('/platform', async (req, res) => {
  try {
    const totalEvents = analyticsEvents.length;
    const uniqueUsers = new Set(analyticsEvents.map(e => e.properties.userId)).size;
    const totalBusinesses = Object.keys(businessMetrics).length;

    // Event breakdown
    const eventBreakdown = {};
    analyticsEvents.forEach(event => {
      eventBreakdown[event.event] = (eventBreakdown[event.event] || 0) + 1;
    });

    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = analyticsEvents
      .filter(e => new Date(e.properties.timestamp) >= last24Hours)
      .sort((a, b) => new Date(b.properties.timestamp) - new Date(a.properties.timestamp))
      .slice(0, 50);

    res.json({
      success: true,
      platformMetrics: {
        totalEvents,
        uniqueUsers,
        totalBusinesses,
        eventBreakdown,
        recentActivity: recentActivity.map(e => ({
          event: e.event,
          timestamp: e.properties.timestamp,
          userId: e.properties.userId,
          businessId: e.properties.businessId
        }))
      }
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

// Helper functions
function calculateAverageTime(events) {
  const sessionEvents = events.filter(e => e.event.includes('session'));
  if (sessionEvents.length === 0) return 0;
  
  const totalTime = sessionEvents.reduce((sum, event) => {
    return sum + (event.properties.timeSpent || 0);
  }, 0);
  
  return Math.round(totalTime / sessionEvents.length);
}

function getTopSources(events) {
  const sources = {};
  events.forEach(event => {
    const source = event.properties.source || 'direct';
    sources[source] = (sources[source] || 0) + 1;
  });
  
  return Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

function getDailyViews(events, startDate, endDate) {
  const dailyViews = {};
  const viewEvents = events.filter(e => e.event === 'business_listing_viewed');
  
  // Initialize all days with 0
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dailyViews[dateStr] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Count actual views
  viewEvents.forEach(event => {
    const dateStr = event.properties.timestamp.split('T')[0];
    if (dailyViews.hasOwnProperty(dateStr)) {
      dailyViews[dateStr]++;
    }
  });
  
  return Object.entries(dailyViews).map(([date, views]) => ({ date, views }));
}

function getPopularTimes(events) {
  const hourCounts = new Array(24).fill(0);
  
  events.forEach(event => {
    const hour = new Date(event.properties.timestamp).getHours();
    hourCounts[hour]++;
  });
  
  return hourCounts.map((count, hour) => ({ hour, count }));
}

function getSearchKeywords(events) {
  const keywords = {};
  events
    .filter(e => e.event === 'search_performed')
    .forEach(event => {
      const keyword = event.properties.searchTerm?.toLowerCase();
      if (keyword) {
        keywords[keyword] = (keywords[keyword] || 0) + 1;
      }
    });
  
  return Object.entries(keywords)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));
}

module.exports = router;
