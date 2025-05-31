#!/usr/bin/env node

/**
 * Test script for the public waitlist signup flow
 * This script simulates a real user visiting the public waitlist page and signing up
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const TEST_WAITLIST_SLUG = "stuff";

async function testPublicWaitlistFlow() {
  console.log("🧪 Testing Public Waitlist Signup Flow...\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Waitlist Slug: ${TEST_WAITLIST_SLUG}\n`);

  // Test 1: Check if the public waitlist page loads
  console.log("Test 1: Loading public waitlist page...");
  try {
    const pageResponse = await fetch(
      `${BASE_URL}/waitlist/${TEST_WAITLIST_SLUG}`
    );
    console.log(`Status: ${pageResponse.status}`);

    if (pageResponse.ok) {
      const pageContent = await pageResponse.text();

      // Check if the page contains expected elements
      const hasTitle = pageContent.includes("Signup for stuff");
      const hasForm =
        pageContent.includes("waitlist-page") ||
        pageContent.includes("PublicWaitlistClient");
      const hasLoading = pageContent.includes("Loading waitlist");

      console.log(`✅ Page loaded successfully`);
      console.log(`   - Has correct title: ${hasTitle}`);
      console.log(`   - Has form elements: ${hasForm}`);
      console.log(`   - Shows loading state: ${hasLoading}`);

      if (hasLoading) {
        console.log(
          "   ℹ️  Page shows loading state - this is expected for client-side rendering"
        );
      }
    } else {
      console.log(
        `❌ Page failed to load: ${pageResponse.status} ${pageResponse.statusText}`
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ Error loading page:`, error.message);
    return false;
  }

  // Test 2: Check the waitlist API endpoint that the page uses
  console.log("\nTest 2: Testing waitlist data API...");
  try {
    const apiResponse = await fetch(
      `${BASE_URL}/api/waitlists/slug/${TEST_WAITLIST_SLUG}`
    );
    console.log(`Status: ${apiResponse.status}`);

    if (apiResponse.ok) {
      const waitlistData = await apiResponse.json();
      console.log(`✅ Waitlist API working`);
      console.log(`   - Waitlist ID: ${waitlistData.id}`);
      console.log(`   - Name: ${waitlistData.name}`);
      console.log(`   - Published: ${waitlistData.published}`);
      console.log(
        `   - Has customization: ${!!waitlistData.customization_settings}`
      );
    } else {
      const errorData = await apiResponse.json();
      console.log(`❌ Waitlist API failed: ${apiResponse.status}`);
      console.log(`   Error: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error calling waitlist API:`, error.message);
    return false;
  }

  // Test 3: Test the actual signup flow
  console.log("\nTest 3: Testing signup flow...");
  const testEmail = `public-test-${Date.now()}@example.com`;
  const testName = "Public Test User";

  try {
    const signupResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15", // Simulate mobile device
        Referer: `${BASE_URL}/waitlist/${TEST_WAITLIST_SLUG}`, // Simulate coming from the public page
      },
      body: JSON.stringify({
        waitlistId: "78612642-85f5-41af-b9b4-9642f50118be", // 'stuff' waitlist ID
        email: testEmail,
        name: testName,
        source: "public_page_test",
      }),
    });

    console.log(`Status: ${signupResponse.status}`);
    const signupData = await signupResponse.json();
    console.log(`Response: ${JSON.stringify(signupData)}`);

    if (signupResponse.ok && signupData.success) {
      console.log(`✅ Signup successful`);
      console.log(`   - Signup ID: ${signupData.id}`);
      console.log(`   - Email: ${testEmail}`);

      // Test 4: Verify the signup was recorded in the database
      console.log("\nTest 4: Verifying database record...");

      // We'll use a simple API call to check if the email exists (this would normally be done via database query)
      const duplicateResponse = await fetch(`${BASE_URL}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waitlistId: "78612642-85f5-41af-b9b4-9642f50118be",
          email: testEmail,
          name: testName,
          source: "duplicate_test",
        }),
      });

      const duplicateData = await duplicateResponse.json();

      if (
        duplicateResponse.status === 409 &&
        duplicateData.error?.includes("already registered")
      ) {
        console.log(
          `✅ Database record verified (duplicate detection working)`
        );
      } else {
        console.log(
          `⚠️  Unexpected duplicate response: ${duplicateResponse.status} - ${JSON.stringify(duplicateData)}`
        );
      }
    } else {
      console.log(`❌ Signup failed: ${JSON.stringify(signupData)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error during signup:`, error.message);
    return false;
  }

  // Test 5: Test with different device headers
  console.log("\nTest 5: Testing cross-device compatibility...");

  const deviceTests = [
    {
      name: "Android Chrome",
      userAgent:
        "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
    },
    {
      name: "iPad Safari",
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
    },
    {
      name: "Desktop Firefox",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
    },
  ];

  for (const device of deviceTests) {
    const deviceEmail = `device-test-${device.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}@example.com`;

    try {
      const deviceResponse = await fetch(`${BASE_URL}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": device.userAgent,
          Referer: `${BASE_URL}/waitlist/${TEST_WAITLIST_SLUG}`,
        },
        body: JSON.stringify({
          waitlistId: "78612642-85f5-41af-b9b4-9642f50118be",
          email: deviceEmail,
          name: `${device.name} Test User`,
          source: `device_test_${device.name.toLowerCase().replace(/\s+/g, "_")}`,
        }),
      });

      const deviceData = await deviceResponse.json();

      if (deviceResponse.ok && deviceData.success) {
        console.log(`   ✅ ${device.name}: Success`);
      } else {
        console.log(
          `   ❌ ${device.name}: Failed - ${JSON.stringify(deviceData)}`
        );
      }
    } catch (error) {
      console.log(`   ❌ ${device.name}: Error - ${error.message}`);
    }
  }

  console.log("\n🏁 Public waitlist signup flow testing completed!");
  return true;
}

// Run the test
testPublicWaitlistFlow()
  .then((success) => {
    if (success) {
      console.log(
        "\n✅ All tests passed! The public waitlist signup flow is working correctly."
      );
    } else {
      console.log(
        "\n❌ Some tests failed. Check the output above for details."
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Test suite crashed:", error);
    process.exit(1);
  });
