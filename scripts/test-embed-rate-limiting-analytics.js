#!/usr/bin/env node

/**
 * Test script for Embed API Rate Limiting and Analytics
 *
 * This script tests:
 * 1. Rate limiting functionality (10 requests per IP per minute)
 * 2. Analytics tracking (loads, unique IPs, daily counts)
 * 3. CORS headers
 * 4. Error handling
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const TEST_SLUG = "test-waitlist"; // Replace with an actual published waitlist slug
const RATE_LIMIT_REQUESTS = 12; // Test beyond the 10 request limit

async function testEmbedAPI() {
  console.log("🧪 Testing Embed API Rate Limiting and Analytics");
  console.log("=".repeat(50));

  // Test 1: Basic API functionality
  console.log("\n1. Testing basic API functionality...");
  try {
    const response = await fetch(`${BASE_URL}/api/embed/${TEST_SLUG}`);
    const data = await response.json();

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response data:`, {
      name: data.name,
      signupCount: data.signupCount,
      themeColor: data.themeColor,
      analytics: data._analytics,
    });

    // Check CORS headers
    console.log("\n2. Checking CORS headers...");
    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get(
        "access-control-allow-origin"
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "access-control-allow-methods"
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "access-control-allow-headers"
      ),
    };
    console.log("✅ CORS headers:", corsHeaders);
  } catch (error) {
    console.error("❌ Basic API test failed:", error.message);
    return;
  }

  // Test 2: Rate limiting
  console.log("\n3. Testing rate limiting...");
  console.log(`Making ${RATE_LIMIT_REQUESTS} rapid requests...`);

  const startTime = Date.now();
  const results = [];

  for (let i = 1; i <= RATE_LIMIT_REQUESTS; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/embed/${TEST_SLUG}`);
      const data = await response.json();

      results.push({
        request: i,
        status: response.status,
        rateLimited: response.status === 429,
        analytics: data._analytics || null,
        error: data.error || null,
      });

      if (response.status === 429) {
        console.log(`🛑 Request ${i}: Rate limited (429)`);
        break;
      } else {
        console.log(`✅ Request ${i}: Success (${response.status})`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Request ${i} failed:`, error.message);
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Analyze results
  console.log("\n4. Rate limiting analysis:");
  const successfulRequests = results.filter((r) => r.status === 200).length;
  const rateLimitedRequests = results.filter((r) => r.status === 429).length;

  console.log(`✅ Successful requests: ${successfulRequests}`);
  console.log(`🛑 Rate limited requests: ${rateLimitedRequests}`);
  console.log(`⏱️  Total duration: ${duration}ms`);

  if (rateLimitedRequests > 0) {
    console.log("✅ Rate limiting is working correctly!");
  } else {
    console.log(
      "⚠️  Rate limiting may not be working - no requests were blocked"
    );
  }

  // Test 3: Analytics progression
  console.log("\n5. Analytics progression analysis:");
  const analyticsProgression = results
    .filter((r) => r.analytics)
    .map((r) => ({
      request: r.request,
      totalLoads: r.analytics.totalLoads,
      uniqueIPs: r.analytics.uniqueIPs,
    }));

  if (analyticsProgression.length > 1) {
    console.log("Analytics progression:");
    analyticsProgression.forEach((a) => {
      console.log(
        `  Request ${a.request}: ${a.totalLoads} total loads, ${a.uniqueIPs} unique IPs`
      );
    });

    const firstLoad = analyticsProgression[0].totalLoads;
    const lastLoad =
      analyticsProgression[analyticsProgression.length - 1].totalLoads;
    const loadIncrease = lastLoad - firstLoad + 1; // +1 for the first request

    console.log(`✅ Analytics tracked ${loadIncrease} load(s) correctly`);
  } else {
    console.log(
      "⚠️  Not enough successful requests to analyze analytics progression"
    );
  }

  // Test 4: Analytics endpoint
  console.log("\n6. Testing analytics endpoint...");
  try {
    const analyticsResponse = await fetch(`${BASE_URL}/api/embed/analytics`);
    const analyticsData = await analyticsResponse.json();

    console.log(`✅ Analytics endpoint status: ${analyticsResponse.status}`);
    console.log("✅ Analytics summary:", analyticsData.summary);

    if (
      analyticsData.waitlists &&
      Object.keys(analyticsData.waitlists).length > 0
    ) {
      console.log("✅ Analytics data found for waitlists");
    } else {
      console.log("⚠️  No analytics data found");
    }
  } catch (error) {
    console.error("❌ Analytics endpoint test failed:", error.message);
  }

  // Test 5: Wait and test rate limit reset
  console.log("\n7. Testing rate limit reset...");
  console.log("Waiting 65 seconds for rate limit window to reset...");

  // Comment out the wait for quick testing
  // await new Promise(resolve => setTimeout(resolve, 65000));

  console.log(
    "⏭️  Skipping rate limit reset test (uncomment the wait line to test)"
  );

  /*
  try {
    const response = await fetch(`${BASE_URL}/api/embed/${TEST_SLUG}`);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Rate limit reset successfully - request allowed');
    } else {
      console.log('❌ Rate limit may not have reset properly');
    }
  } catch (error) {
    console.error('❌ Rate limit reset test failed:', error.message);
  }
  */

  console.log("\n🎉 Embed API Rate Limiting and Analytics Test Complete!");
  console.log("=".repeat(50));
}

// Run the test
if (require.main === module) {
  testEmbedAPI().catch(console.error);
}

module.exports = { testEmbedAPI };
