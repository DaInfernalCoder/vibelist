/**
 * Test script for Waitlist API Endpoints
 *
 * This script provides simplified tests for the waitlist API endpoints.
 * It uses node-fetch to make requests.
 *
 * Tests:
 * 1. Publishing a waitlist
 * 2. Fetching a waitlist by ID
 * 3. Fetching a waitlist by slug
 * 4. Signing up for a waitlist
 *
 * Usage:
 * node scripts/test-waitlist-api-endpoints.js
 */

// Import node-fetch (commonJS compatible)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  waitlistId: null, // Will be set after creating a test waitlist
  waitlistSlug: null, // Will be set after creating a test waitlist
  accessToken: null, // Set this to your test user's access token before running
};

// Initialize tests
console.log("🧪 Starting Waitlist API Tests");
console.log(`Base URL: ${config.baseUrl}`);

if (!config.accessToken) {
  console.log(
    "\n⚠️ Warning: No access token provided. Authentication tests will be skipped."
  );
  console.log(
    "To run authenticated tests, edit this file and set config.accessToken."
  );
}

// Test 1: Create a test waitlist
async function testCreateWaitlist() {
  console.log("\n📝 Test 1: Creating a test waitlist");

  if (!config.accessToken) {
    console.log("❌ Skipped: No access token provided");
    return false;
  }

  try {
    const testData = {
      name: `Test Waitlist ${Date.now()}`,
      description: "A test waitlist created by the API test script",
      customizationData: {
        theme_color: "#4f46e5",
        background_color: "#ffffff",
        text_color: "#111827",
        hero_text: "Join Our Test Waitlist",
        description_text:
          "This is a test waitlist created by the API test script",
        button_text: "Join Waitlist",
      },
    };

    const response = await fetch(`${config.baseUrl}/api/waitlists/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ Success! Created waitlist with status: ${response.status}`
      );
      console.log(`ID: ${data.id}`);
      console.log(`Slug: ${data.slug}`);

      // Store for later tests
      config.waitlistId = data.id;
      config.waitlistSlug = data.slug;
      return true;
    } else {
      console.log(`❌ Failed to create waitlist. Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error creating waitlist:`, err);
    return false;
  }
}

// Test 2: Fetch waitlist by ID
async function testFetchWaitlistById() {
  console.log("\n🔍 Test 2: Fetching waitlist by ID");

  if (!config.waitlistId) {
    console.log("❌ Skipped: No waitlist ID available");
    return false;
  }

  if (!config.accessToken) {
    console.log("❌ Skipped: No access token provided");
    return false;
  }

  try {
    const url = `${config.baseUrl}/api/waitlists/${config.waitlistId}`;
    const options = {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ Success! Fetched waitlist by ID with status: ${response.status}`
      );
      console.log(`Waitlist name: ${data.name}`);
      return true;
    } else {
      console.log(
        `❌ Failed to fetch waitlist by ID. Status: ${response.status}`
      );
      console.log(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error fetching waitlist by ID:`, err);
    return false;
  }
}

// Test 3: Fetch waitlist by slug
async function testFetchWaitlistBySlug() {
  console.log("\n🔍 Test 3: Fetching waitlist by slug");

  if (!config.waitlistSlug) {
    console.log("❌ Skipped: No waitlist slug available");
    return false;
  }

  try {
    const url = `${config.baseUrl}/api/waitlists/slug/${config.waitlistSlug}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ Success! Fetched waitlist by slug with status: ${response.status}`
      );
      console.log(`Waitlist name: ${data.name}`);
      return true;
    } else {
      console.log(
        `❌ Failed to fetch waitlist by slug. Status: ${response.status}`
      );
      console.log(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error fetching waitlist by slug:`, err);
    return false;
  }
}

// Test 4: Sign up for a waitlist
async function testWaitlistSignup() {
  console.log("\n📝 Test 4: Signing up for a waitlist");

  if (!config.waitlistId) {
    console.log("❌ Skipped: No waitlist ID available");
    return false;
  }

  try {
    const testEmail = `signup-test-${Date.now()}@example.com`;
    const url = `${config.baseUrl}/api/waitlists/${config.waitlistId}/signup`;
    const testData = { email: testEmail };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ Success! Signed up to waitlist with status: ${response.status}`
      );
      console.log(`Email used: ${testEmail}`);

      // Test duplicate signup prevention
      console.log("\n🔄 Testing duplicate signup prevention...");
      const duplicateResponse = await fetch(url, options);
      const duplicateData = await duplicateResponse.json();

      if (duplicateResponse.status === 400) {
        console.log(
          `✅ Success! Properly rejected duplicate signup with status: ${duplicateResponse.status}`
        );
      } else {
        console.log(
          `❌ Failed to reject duplicate signup. Status: ${duplicateResponse.status}`
        );
        console.log(`Response: ${JSON.stringify(duplicateData)}`);
      }

      return true;
    } else {
      console.log(
        `❌ Failed to sign up to waitlist. Status: ${response.status}`
      );
      console.log(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error signing up to waitlist:`, err);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    // Test 1: Create a waitlist
    const waitlistCreated = await testCreateWaitlist();

    // Only run the following tests if the waitlist was created
    if (waitlistCreated) {
      // Test 2: Fetch waitlist by ID
      await testFetchWaitlistById();

      // Test 3: Fetch waitlist by slug
      await testFetchWaitlistBySlug();

      // Test 4: Sign up to waitlist
      await testWaitlistSignup();
    }

    console.log("\n✅ All tests completed!");
  } catch (err) {
    console.error("\n❌ Unexpected error during tests:", err);
  }
}

// Run the tests
runTests();
