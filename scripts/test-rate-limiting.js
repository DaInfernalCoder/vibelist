/**
 * Test script to verify rate limiting functionality
 * This tests that rate limiting prevents abuse while allowing legitimate usage
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  testSlug: process.env.TEST_WAITLIST_SLUG || "stuff",
  maxRequests: 10, // Should match RATE_LIMIT_MAX_REQUESTS in the API
};

console.log("🛡️  Testing Rate Limiting Functionality\n");
console.log(`Base URL: ${config.baseUrl}`);
console.log(`Test Slug: ${config.testSlug}`);
console.log(`Expected Rate Limit: ${config.maxRequests} requests per minute\n`);

async function getWaitlistId() {
  try {
    const response = await fetch(
      `${config.baseUrl}/api/waitlists/slug/${config.testSlug}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch waitlist: ${response.status}`);
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("❌ Failed to get waitlist ID:", error.message);
    return null;
  }
}

async function testSingleRequest(waitlistId, requestNumber) {
  const testEmail = `rate-limit-test-${Date.now()}-${requestNumber}@example.com`;

  try {
    const response = await fetch(`${config.baseUrl}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        waitlistId: waitlistId,
        email: testEmail,
        name: `Rate Limit Test User ${requestNumber}`,
        source: "rate_limit_test",
      }),
    });

    const data = await response.json();

    return {
      requestNumber,
      status: response.status,
      success: response.ok,
      data: data,
      isRateLimited: response.status === 429,
      email: testEmail,
    };
  } catch (error) {
    return {
      requestNumber,
      status: 0,
      success: false,
      error: error.message,
      email: testEmail,
    };
  }
}

async function testRateLimiting() {
  console.log("📋 Step 1: Getting waitlist ID...");

  const waitlistId = await getWaitlistId();
  if (!waitlistId) {
    console.log("❌ Cannot proceed without waitlist ID");
    return;
  }

  console.log(`✅ Waitlist ID: ${waitlistId}\n`);

  console.log("🚀 Step 2: Testing rate limiting...");
  console.log(`   Sending ${config.maxRequests + 5} requests rapidly...\n`);

  const requests = [];
  const startTime = Date.now();

  // Send requests rapidly to trigger rate limiting
  for (let i = 1; i <= config.maxRequests + 5; i++) {
    requests.push(testSingleRequest(waitlistId, i));
  }

  // Wait for all requests to complete
  const results = await Promise.all(requests);
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log(`⏱️  All requests completed in ${totalTime}ms\n`);

  // Analyze results
  const successful = results.filter((r) => r.success);
  const rateLimited = results.filter((r) => r.isRateLimited);
  const errors = results.filter((r) => !r.success && !r.isRateLimited);

  console.log("📊 Results Summary:");
  console.log(`   ✅ Successful signups: ${successful.length}`);
  console.log(`   🛡️  Rate limited: ${rateLimited.length}`);
  console.log(`   ❌ Other errors: ${errors.length}`);
  console.log(`   📈 Total requests: ${results.length}\n`);

  // Detailed results
  console.log("📋 Detailed Results:");
  results.forEach((result) => {
    const status = result.isRateLimited
      ? "🛡️  RATE LIMITED"
      : result.success
        ? "✅ SUCCESS"
        : "❌ ERROR";
    console.log(
      `   Request ${result.requestNumber}: ${status} (${result.status})`
    );

    if (result.isRateLimited && result.data.code) {
      console.log(`      Code: ${result.data.code}`);
    }
    if (result.success && result.data.id) {
      console.log(`      Signup ID: ${result.data.id}`);
    }
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Validation
  console.log("\n🔍 Validation:");

  if (successful.length <= config.maxRequests) {
    console.log(
      `✅ Rate limiting working: Only ${successful.length} requests succeeded (limit: ${config.maxRequests})`
    );
  } else {
    console.log(
      `❌ Rate limiting failed: ${successful.length} requests succeeded (should be ≤ ${config.maxRequests})`
    );
  }

  if (rateLimited.length > 0) {
    console.log(
      `✅ Rate limiting triggered: ${rateLimited.length} requests were rate limited`
    );

    // Check if rate limited requests have proper error codes
    const properCodes = rateLimited.filter(
      (r) => r.data.code === "RATE_LIMITED"
    );
    if (properCodes.length === rateLimited.length) {
      console.log(`✅ Rate limited requests have proper error codes`);
    } else {
      console.log(`⚠️  Some rate limited requests missing proper error codes`);
    }
  } else {
    console.log(
      `⚠️  No requests were rate limited (this might indicate rate limiting isn't working)`
    );
  }

  // Test recovery after rate limit
  if (rateLimited.length > 0) {
    console.log("\n⏳ Step 3: Testing recovery after rate limit...");
    console.log("   Waiting 5 seconds before testing recovery...");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const recoveryResult = await testSingleRequest(waitlistId, "recovery");

    if (recoveryResult.success) {
      console.log("✅ Recovery successful: Rate limit cleared after waiting");
    } else if (recoveryResult.isRateLimited) {
      console.log(
        "⚠️  Still rate limited after 5 seconds (rate limit window may be longer)"
      );
    } else {
      console.log(
        `❌ Recovery failed with error: ${recoveryResult.error || recoveryResult.data.error}`
      );
    }
  }
}

async function main() {
  try {
    await testRateLimiting();
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }

  console.log("\n🏁 Rate limiting test completed");
}

main().catch(console.error);
