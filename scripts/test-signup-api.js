#!/usr/bin/env node

/**
 * Test script for the waitlist signup API endpoint
 * This script tests cross-device compatibility and database integration
 */

// Node.js 18+ has built-in fetch

const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";
const TEST_WAITLIST_ID = "78612642-85f5-41af-b9b4-9642f50118be"; // 'stuff' waitlist

async function testSignupAPI() {
  console.log("🧪 Testing Waitlist Signup API...\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Waitlist ID: ${TEST_WAITLIST_ID}\n`);

  // Test 1: Valid signup
  console.log("Test 1: Valid signup...");
  const testEmail = `api-test-${Date.now()}@example.com`;

  try {
    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cross-Device-Test/1.0",
        Origin: "https://example.com", // Simulate cross-origin request
      },
      body: JSON.stringify({
        waitlistId: TEST_WAITLIST_ID,
        email: testEmail,
        name: "API Test User",
        source: "api_test",
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Valid signup test passed\n");
    } else {
      console.log("❌ Valid signup test failed\n");
    }
  } catch (error) {
    console.log("❌ Error in valid signup test:", error.message, "\n");
  }

  // Test 2: Duplicate signup
  console.log("Test 2: Duplicate signup...");
  try {
    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cross-Device-Test/1.0",
      },
      body: JSON.stringify({
        waitlistId: TEST_WAITLIST_ID,
        email: testEmail, // Same email as before
        name: "Duplicate Test User",
        source: "duplicate_test",
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 409) {
      console.log("✅ Duplicate signup test passed (correctly rejected)\n");
    } else {
      console.log("❌ Duplicate signup test failed (should return 409)\n");
    }
  } catch (error) {
    console.log("❌ Error in duplicate signup test:", error.message, "\n");
  }

  // Test 3: Invalid waitlist ID
  console.log("Test 3: Invalid waitlist ID...");
  try {
    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cross-Device-Test/1.0",
      },
      body: JSON.stringify({
        waitlistId: "00000000-0000-0000-0000-000000000000",
        email: `invalid-test-${Date.now()}@example.com`,
        name: "Invalid Test User",
        source: "invalid_test",
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 404) {
      console.log("✅ Invalid waitlist ID test passed (correctly rejected)\n");
    } else {
      console.log("❌ Invalid waitlist ID test failed (should return 404)\n");
    }
  } catch (error) {
    console.log("❌ Error in invalid waitlist ID test:", error.message, "\n");
  }

  // Test 4: Missing required fields
  console.log("Test 4: Missing required fields...");
  try {
    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cross-Device-Test/1.0",
      },
      body: JSON.stringify({
        waitlistId: TEST_WAITLIST_ID,
        // Missing email
        name: "Missing Email Test User",
        source: "missing_field_test",
      }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log(
        "✅ Missing required fields test passed (correctly rejected)\n"
      );
    } else {
      console.log(
        "❌ Missing required fields test failed (should return 400)\n"
      );
    }
  } catch (error) {
    console.log(
      "❌ Error in missing required fields test:",
      error.message,
      "\n"
    );
  }

  // Test 5: CORS preflight
  console.log("Test 5: CORS preflight...");
  try {
    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    console.log(`Status: ${response.status}`);
    console.log(`CORS Headers:`, {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin"
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods"
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers"
      ),
    });

    if (
      response.status === 200 &&
      response.headers.get("Access-Control-Allow-Origin")
    ) {
      console.log("✅ CORS preflight test passed\n");
    } else {
      console.log("❌ CORS preflight test failed\n");
    }
  } catch (error) {
    console.log("❌ Error in CORS preflight test:", error.message, "\n");
  }

  console.log("🏁 API testing completed!");
}

// Run the tests
testSignupAPI().catch(console.error);
