/**
 * Test script to verify email-based rate limiting functionality
 * This tests that multiple users can sign up from the same IP while preventing spam per email
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  testSlug: process.env.TEST_WAITLIST_SLUG || "stuff",
  maxRequestsPerEmail: 3, // Should match RATE_LIMIT_MAX_REQUESTS in the API
};

console.log("📧 Testing Email-Based Rate Limiting Functionality\n");
console.log(`Base URL: ${config.baseUrl}`);
console.log(`Test Slug: ${config.testSlug}`);
console.log(
  `Expected Rate Limit: ${config.maxRequestsPerEmail} requests per email per minute\n`
);

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

async function testSignupRequest(waitlistId, email, requestNumber) {
  try {
    const response = await fetch(`${config.baseUrl}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        waitlistId: waitlistId,
        email: email,
        name: `Test User ${requestNumber}`,
        source: "email_rate_limit_test",
      }),
    });

    const data = await response.json();

    return {
      requestNumber,
      email,
      status: response.status,
      success: response.ok,
      data: data,
      isRateLimited: response.status === 429,
      isDuplicate: response.status === 409,
    };
  } catch (error) {
    return {
      requestNumber,
      email,
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

async function testEmailRateLimiting() {
  console.log("📋 Step 1: Getting waitlist ID...");

  const waitlistId = await getWaitlistId();
  if (!waitlistId) {
    console.log("❌ Cannot proceed without waitlist ID");
    return;
  }

  console.log(`✅ Waitlist ID: ${waitlistId}\n`);

  console.log("🚀 Step 2: Testing multiple users from same IP...");
  console.log(
    "   Testing that different emails can all sign up successfully...\n"
  );

  const timestamp = Date.now();
  const multiUserTests = [];

  // Test 5 different users from the same IP
  for (let i = 1; i <= 5; i++) {
    const email = `multi-user-test-${timestamp}-${i}@example.com`;
    multiUserTests.push(testSignupRequest(waitlistId, email, i));
  }

  const multiUserResults = await Promise.all(multiUserTests);

  console.log("📊 Multi-User Results:");
  multiUserResults.forEach((result) => {
    const status = result.isDuplicate
      ? "🔄 DUPLICATE"
      : result.success
        ? "✅ SUCCESS"
        : "❌ ERROR";
    console.log(
      `   User ${result.requestNumber} (${result.email}): ${status} (${result.status})`
    );
    if (result.success && result.data.id) {
      console.log(`      Signup ID: ${result.data.id}`);
    }
  });

  const successfulMultiUser = multiUserResults.filter((r) => r.success);
  console.log(
    `\n✅ Multi-user test: ${successfulMultiUser.length}/5 users successfully signed up\n`
  );

  console.log("🛡️  Step 3: Testing email-based rate limiting...");
  console.log(
    "   Testing that same email gets rate limited after multiple attempts...\n"
  );

  const sameEmailTests = [];
  const testEmail = `rate-limit-test-${timestamp}@example.com`;

  // Test same email multiple times to trigger rate limiting
  for (let i = 1; i <= config.maxRequestsPerEmail + 2; i++) {
    sameEmailTests.push(testSignupRequest(waitlistId, testEmail, i));
  }

  const sameEmailResults = await Promise.all(sameEmailTests);

  console.log("📊 Same Email Results:");
  sameEmailResults.forEach((result) => {
    const status = result.isRateLimited
      ? "🛡️  RATE LIMITED"
      : result.isDuplicate
        ? "🔄 DUPLICATE"
        : result.success
          ? "✅ SUCCESS"
          : "❌ ERROR";
    console.log(
      `   Attempt ${result.requestNumber}: ${status} (${result.status})`
    );
    if (result.isRateLimited && result.data.code) {
      console.log(`      Code: ${result.data.code}`);
    }
    if (result.success && result.data.id) {
      console.log(`      Signup ID: ${result.data.id}`);
    }
  });

  const successfulSameEmail = sameEmailResults.filter((r) => r.success);
  const rateLimitedSameEmail = sameEmailResults.filter((r) => r.isRateLimited);
  const duplicateSameEmail = sameEmailResults.filter((r) => r.isDuplicate);

  console.log("\n🔍 Validation:");

  // Validate multi-user functionality
  if (successfulMultiUser.length === 5) {
    console.log(
      "✅ Multi-user functionality working: All 5 different users signed up successfully"
    );
  } else {
    console.log(
      `⚠️  Multi-user issue: Only ${successfulMultiUser.length}/5 users signed up`
    );
  }

  // Validate email rate limiting
  if (successfulSameEmail.length === 1) {
    console.log(
      "✅ Email rate limiting working: Only 1 signup succeeded for same email"
    );
  } else {
    console.log(
      `⚠️  Email rate limiting issue: ${successfulSameEmail.length} signups succeeded (should be 1)`
    );
  }

  if (duplicateSameEmail.length >= 1) {
    console.log(
      "✅ Duplicate prevention working: Subsequent attempts detected as duplicates"
    );
  }

  if (rateLimitedSameEmail.length > 0) {
    console.log(
      `✅ Rate limiting triggered: ${rateLimitedSameEmail.length} requests were rate limited`
    );
  }

  console.log("\n📈 Summary:");
  console.log(
    `   Different users from same IP: ${successfulMultiUser.length}/5 succeeded ✅`
  );
  console.log(
    `   Same email attempts: ${successfulSameEmail.length} succeeded, ${duplicateSameEmail.length} duplicates, ${rateLimitedSameEmail.length} rate limited`
  );
}

async function main() {
  try {
    await testEmailRateLimiting();
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }

  console.log("\n🏁 Email-based rate limiting test completed");
}

main().catch(console.error);
