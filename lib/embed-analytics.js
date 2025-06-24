// Shared embed analytics functionality
// This module provides analytics tracking for embed widgets

// Analytics tracking storage
const embedAnalytics = new Map();

/**
 * Track embed analytics
 */
export function trackEmbedAnalytics(waitlistId, slug, ip, userAgent) {
  const now = Date.now();
  const key = `embed_analytics_${waitlistId}`;

  if (!embedAnalytics.has(key)) {
    embedAnalytics.set(key, {
      waitlistId,
      slug,
      totalLoads: 0,
      uniqueIPs: new Set(),
      lastLoad: now,
      dailyLoads: new Map(),
    });
  }

  const analytics = embedAnalytics.get(key);
  analytics.totalLoads++;
  analytics.uniqueIPs.add(ip);
  analytics.lastLoad = now;

  // Track daily loads
  const today = new Date().toISOString().split("T")[0];
  const dailyCount = analytics.dailyLoads.get(today) || 0;
  analytics.dailyLoads.set(today, dailyCount + 1);

  // Clean up old daily data (keep only last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

  for (const [date] of analytics.dailyLoads) {
    if (date < cutoffDate) {
      analytics.dailyLoads.delete(date);
    }
  }

  return analytics;
}

/**
 * Get embed analytics for all waitlists
 */
export function getEmbedAnalytics() {
  const analyticsData = {};

  for (const [key, analytics] of embedAnalytics) {
    const waitlistId = analytics.waitlistId;
    analyticsData[waitlistId] = {
      waitlistId: analytics.waitlistId,
      slug: analytics.slug,
      totalLoads: analytics.totalLoads,
      uniqueIPs: analytics.uniqueIPs.size,
      lastLoad: new Date(analytics.lastLoad).toISOString(),
      dailyLoads: Object.fromEntries(analytics.dailyLoads),
    };
  }

  return analyticsData;
}

/**
 * Get analytics for a specific waitlist
 */
export function getWaitlistEmbedAnalytics(waitlistId) {
  const key = `embed_analytics_${waitlistId}`;
  const analytics = embedAnalytics.get(key);

  if (!analytics) {
    return null;
  }

  return {
    waitlistId: analytics.waitlistId,
    slug: analytics.slug,
    totalLoads: analytics.totalLoads,
    uniqueIPs: analytics.uniqueIPs.size,
    lastLoad: new Date(analytics.lastLoad).toISOString(),
    dailyLoads: Object.fromEntries(analytics.dailyLoads),
  };
}

/**
 * Clear analytics data (for testing purposes)
 */
export function clearEmbedAnalytics() {
  embedAnalytics.clear();
}
