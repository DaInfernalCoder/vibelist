/**
 * Test script to verify cross-device waitlist signup functionality
 * This simulates accessing a waitlist link from a different device without authentication
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  // Test with a known published waitlist slug
  testSlug: process.env.TEST_WAITLIST_SLUG || null,
};

console.log("🧪 Testing Cross-Device Waitlist Signup Functionality\n");
console.log(`Base URL: ${config.baseUrl}`);

async function testCrossDeviceSignup() {
  if (!config.testSlug) {
    console.log(
      "❌ No test waitlist slug provided. Set TEST_WAITLIST_SLUG environment variable."
    );
    console.log(
      "   Example: TEST_WAITLIST_SLUG=my-test-waitlist npm run test:cross-device"
    );
    return;
  }

  try {
    console.log(
      `\n📱 Step 1: Fetching waitlist data for slug: ${config.testSlug}`
    );

    // Step 1: Fetch waitlist data (simulating page load on new device)
    const waitlistResponse = await fetch(
      `${config.baseUrl}/api/waitlists/slug/${config.testSlug}`
    );

    if (!waitlistResponse.ok) {
      console.log(
        `❌ Failed to fetch waitlist data: ${waitlistResponse.status} ${waitlistResponse.statusText}`
      );
      return;
    }

    const waitlistData = await waitlistResponse.json();
    console.log(
      `✅ Waitlist found: ${waitlistData.name} (ID: ${waitlistData.id})`
    );
    console.log(`   Published: ${waitlistData.published}`);

    if (!waitlistData.published) {
      console.log("❌ Waitlist is not published, cannot test signup");
      return;
    }

    // Step 2: Test signup without authentication (simulating different device)
    console.log(`\n📝 Step 2: Testing unauthenticated signup...`);

    const testEmail = `cross-device-test-${Date.now()}@example.com`;
    const signupData = {
      waitlistId: waitlistData.id,
      email: testEmail,
      name: "Cross Device Test User",
      source: "cross_device_test",
    };

    console.log(`   Using email: ${testEmail}`);
    console.log(`   Waitlist ID: ${waitlistData.id}`);

    const signupResponse = await fetch(`${config.baseUrl}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Explicitly no authentication headers to simulate cross-device access
      },
      body: JSON.stringify(signupData),
    });

    const signupResult = await signupResponse.json();

    console.log(`   Response status: ${signupResponse.status}`);
    console.log(`   Response body: ${JSON.stringify(signupResult, null, 2)}`);

    if (signupResponse.ok && signupResult.success) {
      console.log(`✅ SUCCESS: Cross-device signup worked!`);
      console.log(`   Signup ID: ${signupResult.id}`);

      // Step 3: Verify duplicate prevention still works
      console.log(`\n🔄 Step 3: Testing duplicate prevention...`);

      const duplicateResponse = await fetch(`${config.baseUrl}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const duplicateResult = await duplicateResponse.json();

      if (duplicateResponse.status === 409) {
        console.log(`✅ Duplicate prevention working correctly`);
      } else {
        console.log(
          `⚠️  Duplicate prevention may not be working: ${duplicateResponse.status}`
        );
        console.log(`   Response: ${JSON.stringify(duplicateResult, null, 2)}`);
      }
    } else {
      console.log(`❌ FAILED: Cross-device signup failed`);
      console.log(`   This indicates the bug is still present`);

      if (signupResponse.status === 401) {
        console.log(`   → Authentication required (device-specific issue)`);
      } else if (signupResponse.status === 403) {
        console.log(`   → Forbidden (RLS policy issue)`);
      } else {
        console.log(`   → Other error: ${signupResult.error || "Unknown"}`);
      }
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

async function findTestWaitlist() {
  console.log("\n🔍 Looking for a published waitlist to test with...");

  try {
    // This would require authentication, so we'll skip auto-discovery
    console.log("   Manual setup required: Please provide TEST_WAITLIST_SLUG");
    console.log("   You can find a waitlist slug from your dashboard");
  } catch (error) {
    console.log("   Could not auto-discover waitlists (expected without auth)");
  }
}

// Main execution
async function main() {
  if (config.testSlug) {
    await testCrossDeviceSignup();
  } else {
    await findTestWaitlist();
  }

  console.log("\n🏁 Test completed");
}

main().catch(console.error);
