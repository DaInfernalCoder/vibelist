/**
 * Test script for Waitlist Publishing API endpoints
 *
 * This script tests:
 * 1. Waitlist publishing with customization data
 * 2. Slug generation and collision handling
 * 3. Fetching published waitlists by ID and slug
 * 4. Error handling for invalid inputs
 *
 * Usage:
 * node scripts/test-waitlist-publish-api.js
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
// Import node-fetch v2 (compatible with CommonJS)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Load environment variables from .env.local
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Set base URL for API requests
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log("Test environment:");
console.log("- Base URL:", BASE_URL);
console.log("- Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "- Supabase Service Role Key:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "[REDACTED]" : "Not found"
);

// Validate environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Missing required environment variables. Make sure .env.local contains:"
  );
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Initialize Supabase client with service role key for testing
// ⚠️ Don't use service role key in production code or commit it to Git
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Global variables to store test data
let testUser = null;
let testSession = null;
let testWaitlists = [];

/**
 * Creates a test user and returns a session for testing
 */
async function setupTestUser() {
  console.log("\n🔑 Setting up test user...");

  try {
    // Create a test user with a random email
    const email = `test-${Date.now()}@example.com`;
    const password = "Password123!";

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    testUser = data.user;
    console.log(`✓ Created test user: ${testUser.id} (${testUser.email})`);

    // Sign in to get a session
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      throw new Error(`Failed to sign in as test user: ${signInError.message}`);
    }

    testSession = sessionData.session;
    console.log(`✓ Created session for test user`);

    return { user: testUser, session: testSession };
  } catch (err) {
    console.error("❌ Error creating test user:", err);
    process.exit(1);
  }
}

/**
 * Test slug generation with various inputs
 */
async function testSlugGeneration() {
  console.log("\n🔤 Testing slug generation with various inputs...");

  const testCases = [
    { name: "Simple Waitlist", expected: /simple-waitlist/ },
    { name: "Waitlist with Spaces", expected: /waitlist-with-spaces/ },
    {
      name: "Special Ch@racters & Sym&ols!!",
      expected: /special-chracters-symols/,
    },
    { name: "émojis 🚀 and unicode", expected: /emojis-and-unicode/ },
    {
      name: "Very long waitlist name that should be truncated to a reasonable length for a URL slug",
      expected: /very-long-waitlist-name/,
    },
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${BASE_URL}/api/waitlists/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          name: testCase.name,
          description: "Test description",
          customizationData: {
            theme_color: "#ff0000",
            background_color: "#ffffff",
            text_color: "#000000",
            hero_text: "Test Hero",
            description_text: "Test Description",
            button_text: "Join Test",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `API returned error: ${data.error || response.statusText}`
        );
      }

      // Verify slug was generated and matches expected pattern
      if (!data.slug || !testCase.expected.test(data.slug)) {
        console.log(`❌ Slug generation failed for "${testCase.name}"`);
        console.log(`   Expected pattern: ${testCase.expected}`);
        console.log(`   Actual slug: ${data.slug}`);
      } else {
        console.log(`✓ Slug generated for "${testCase.name}": ${data.slug}`);
        testWaitlists.push(data);
      }
    } catch (err) {
      console.error(
        `❌ Error testing slug generation for "${testCase.name}":`,
        err
      );
    }
  }
}

/**
 * Test slug collision handling
 */
async function testSlugCollision() {
  console.log("\n🔄 Testing slug collision handling...");

  // Create a waitlist with a specific name
  const waitlistName = "Collision Test";

  try {
    // Create first waitlist
    const response1 = await fetch(`${BASE_URL}/api/waitlists/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testSession.access_token}`,
      },
      body: JSON.stringify({
        name: waitlistName,
        description: "First waitlist with this name",
      }),
    });

    const data1 = await response1.json();

    if (!response1.ok) {
      throw new Error(
        `API returned error: ${data1.error || response1.statusText}`
      );
    }

    console.log(
      `✓ Created first waitlist with name "${waitlistName}": ${data1.slug}`
    );
    testWaitlists.push(data1);

    // Create second waitlist with same name
    const response2 = await fetch(`${BASE_URL}/api/waitlists/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testSession.access_token}`,
      },
      body: JSON.stringify({
        name: waitlistName,
        description: "Second waitlist with this name",
      }),
    });

    const data2 = await response2.json();

    if (!response2.ok) {
      throw new Error(
        `API returned error: ${data2.error || response2.statusText}`
      );
    }

    console.log(
      `✓ Created second waitlist with name "${waitlistName}": ${data2.slug}`
    );
    testWaitlists.push(data2);

    // Verify slugs are different
    if (data1.slug === data2.slug) {
      console.log(
        `❌ Slug collision not handled correctly. Both waitlists have slug: ${data1.slug}`
      );
    } else {
      console.log(`✓ Slug collision handled correctly:`);
      console.log(`  - First waitlist slug: ${data1.slug}`);
      console.log(`  - Second waitlist slug: ${data2.slug}`);
    }
  } catch (err) {
    console.error(`❌ Error testing slug collision:`, err);
  }
}

/**
 * Test customization data handling
 */
async function testCustomizationData() {
  console.log("\n🎨 Testing customization data handling...");

  const customizationData = {
    theme_color: "#00ff00",
    background_color: "#f0f0f0",
    text_color: "#333333",
    hero_text: "Custom Hero Text",
    description_text: "This is a custom description for testing purposes",
    button_text: "Sign Up Now",
    font_family: "Arial, sans-serif",
  };

  try {
    // Create waitlist with customization data
    const response = await fetch(`${BASE_URL}/api/waitlists/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testSession.access_token}`,
      },
      body: JSON.stringify({
        name: "Customized Waitlist",
        description: "Testing customization data",
        customizationData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `API returned error: ${data.error || response.statusText}`
      );
    }

    console.log(`✓ Created waitlist with customization data: ${data.id}`);
    testWaitlists.push(data);

    // Fetch the waitlist to verify customization data was saved
    const getResponse = await fetch(`${BASE_URL}/api/waitlists/${data.id}`, {
      headers: {
        Authorization: `Bearer ${testSession.access_token}`,
      },
    });

    const getWaitlist = await getResponse.json();

    if (!getResponse.ok) {
      throw new Error(
        `API returned error: ${getWaitlist.error || getResponse.statusText}`
      );
    }

    // Verify customization data
    if (!getWaitlist.template_data) {
      console.log(`❌ Customization data not found in fetched waitlist`);
    } else {
      console.log(`✓ Customization data saved correctly:`);
      console.log(`  - Theme color: ${getWaitlist.template_data.theme_color}`);
      console.log(`  - Hero text: ${getWaitlist.template_data.hero_text}`);
      console.log(`  - Button text: ${getWaitlist.template_data.button_text}`);
    }
  } catch (err) {
    console.error(`❌ Error testing customization data:`, err);
  }
}

/**
 * Test error handling with invalid inputs
 */
async function testErrorHandling() {
  console.log("\n❗ Testing error handling with invalid inputs...");

  const testCases = [
    {
      name: "Missing name",
      body: { description: "This should fail" },
      expectedStatus: 400,
    },
    {
      name: "Invalid customizationData",
      body: {
        name: "Invalid Data Test",
        customizationData: "not-an-object",
      },
      expectedStatus: 400,
    },
    {
      name: "Missing authorization",
      body: { name: "Auth Test" },
      skipAuth: true,
      expectedStatus: 401,
    },
  ];

  for (const testCase of testCases) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (!testCase.skipAuth) {
        headers["Authorization"] = `Bearer ${testSession.access_token}`;
      }

      const response = await fetch(`${BASE_URL}/api/waitlists/publish`, {
        method: "POST",
        headers,
        body: JSON.stringify(testCase.body),
      });

      const data = await response.json();

      if (response.status === testCase.expectedStatus) {
        console.log(
          `✓ Test "${testCase.name}" correctly returned ${response.status}: ${
            data.error || "No error message"
          }`
        );
      } else {
        console.log(
          `❌ Test "${testCase.name}" returned ${response.status} instead of expected ${testCase.expectedStatus}`
        );
        console.log(`   Response:`, data);
      }
    } catch (err) {
      console.error(`❌ Error testing "${testCase.name}":`, err);
    }
  }
}

/**
 * Test fetching waitlist by slug
 */
async function testFetchBySlug() {
  console.log("\n🔍 Testing fetch waitlist by slug...");

  if (testWaitlists.length === 0) {
    console.log("❌ No test waitlists available to test");
    return;
  }

  const waitlist = testWaitlists[0];

  try {
    // Fetch the waitlist by slug
    const response = await fetch(
      `${BASE_URL}/api/waitlists/slug/${waitlist.slug}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `API returned error: ${data.error || response.statusText}`
      );
    }

    console.log(`✓ Successfully fetched waitlist by slug: ${waitlist.slug}`);
    console.log(`  - Name: ${data.name}`);
    console.log(`  - ID: ${data.id}`);

    // Test with non-existent slug
    const nonExistentResponse = await fetch(
      `${BASE_URL}/api/waitlists/slug/non-existent-slug-12345`
    );

    if (nonExistentResponse.status === 404) {
      console.log(`✓ Correctly returned 404 for non-existent slug`);
    } else {
      console.log(
        `❌ Expected 404 for non-existent slug but got ${nonExistentResponse.status}`
      );
    }
  } catch (err) {
    console.error(`❌ Error testing fetch by slug:`, err);
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log("\n🧹 Cleaning up test data...");

  // Delete test waitlists
  for (const waitlist of testWaitlists) {
    try {
      const { error } = await supabase
        .from("waitlists")
        .delete()
        .eq("id", waitlist.id);

      if (error) {
        console.log(
          `❌ Failed to delete waitlist ${waitlist.id}: ${error.message}`
        );
      } else {
        console.log(`✓ Deleted waitlist: ${waitlist.id}`);
      }
    } catch (err) {
      console.error(`❌ Error deleting waitlist ${waitlist.id}:`, err);
    }
  }

  // Delete test user
  if (testUser) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(testUser.id);

      if (error) {
        console.log(`❌ Failed to delete test user: ${error.message}`);
      } else {
        console.log(`✓ Deleted test user: ${testUser.id}`);
      }
    } catch (err) {
      console.error(`❌ Error deleting test user:`, err);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log("🧪 Starting API tests for waitlist publishing...");

    await setupTestUser();
    await testSlugGeneration();
    await testSlugCollision();
    await testCustomizationData();
    await testErrorHandling();
    await testFetchBySlug();

    console.log("\n✅ Tests completed!");
  } catch (err) {
    console.error("❌ Unexpected error during tests:", err);
  } finally {
    await cleanupTestData();
  }
}

// Run the tests
runTests();
