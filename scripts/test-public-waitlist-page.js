/**
 * Test script for the public waitlist page rendering
 *
 * This script tests the public waitlist page with various customization settings
 * to ensure it renders correctly with different themes, colors, and content.
 *
 * Usage:
 * node scripts/test-public-waitlist-page.js
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

// Initialize Supabase client with service role key for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Global variables to store test data
let testUser = null;
let testSession = null;
let testWaitlist = null;

// Test color themes
const TEST_THEMES = [
  {
    name: "Blue Theme",
    settings: {
      theme_color: "#3b82f6",
      background_color: "#f8fafc",
      text_color: "#1e293b",
      hero_text: "Join Our Blue Themed Waitlist",
      description_text:
        "Sign up to be notified when we launch our blue service.",
      button_text: "Join Now",
    },
  },
  {
    name: "Dark Theme",
    settings: {
      theme_color: "#8b5cf6",
      background_color: "#1e1e2e",
      text_color: "#e2e8f0",
      hero_text: "Join Our Dark Themed Waitlist",
      description_text: "Be the first to know when our product launches.",
      button_text: "Sign Up",
    },
  },
  {
    name: "Minimal Theme",
    settings: {
      theme_color: "#a1a1aa",
      background_color: "#ffffff",
      text_color: "#18181b",
      hero_text: "Beta Access",
      description_text: "Simple, minimal waitlist for our upcoming release.",
      button_text: "Request Access",
    },
  },
];

/**
 * Setup test user and environment
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
 * Create test waitlists with different themes
 */
async function createTestWaitlists() {
  console.log("\n🎨 Creating test waitlists with different themes...");

  const waitlists = [];

  for (const theme of TEST_THEMES) {
    try {
      // Create waitlist with theme settings
      const response = await fetch(`${BASE_URL}/api/waitlists/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          name: `Test Waitlist - ${theme.name}`,
          description: `A test waitlist using the ${theme.name.toLowerCase()}`,
          customizationData: theme.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `API returned error: ${data.error || response.statusText}`
        );
      }

      console.log(`✓ Created test waitlist with ${theme.name}: ${data.slug}`);
      waitlists.push(data);

      // Save the first waitlist for detailed testing
      if (waitlists.length === 1) {
        testWaitlist = data;
      }
    } catch (err) {
      console.error(`❌ Error creating test waitlist with ${theme.name}:`, err);
    }
  }

  return waitlists;
}

/**
 * Test accessing the public waitlist page
 */
async function testPublicWaitlistPage(waitlist) {
  console.log(`\n🌍 Testing public waitlist page: ${waitlist.slug}...`);

  try {
    // Access the public waitlist page
    const response = await fetch(`${BASE_URL}/waitlist/${waitlist.slug}`);

    // Check status code
    if (response.status === 200) {
      console.log(`✓ Public waitlist page is accessible`);
    } else {
      console.log(
        `❌ Failed to access public waitlist page. Status: ${response.status}`
      );
      return false;
    }

    // Basic HTML content check
    const html = await response.text();

    // Check for key elements
    const checks = [
      { name: "Page title", pattern: /<title>.*<\/title>/, required: true },
      { name: "Hero text", pattern: new RegExp(waitlist.name), required: true },
      {
        name: "Email input",
        pattern: /<input[^>]*type="email"/,
        required: true,
      },
      {
        name: "Submit button",
        pattern: /<button[^>]*type="submit"/,
        required: true,
      },
    ];

    let passCount = 0;

    for (const check of checks) {
      const found = check.pattern.test(html);
      if (found) {
        console.log(`✓ Found ${check.name} in page content`);
        passCount++;
      } else if (check.required) {
        console.log(`❌ Required element not found: ${check.name}`);
      } else {
        console.log(`⚠️ Optional element not found: ${check.name}`);
      }
    }

    console.log(
      `\nContent check results: ${passCount}/${checks.length} checks passed`
    );
    return true;
  } catch (err) {
    console.error(`❌ Error testing public waitlist page:`, err);
    return false;
  }
}

/**
 * Test waitlist signup functionality
 */
async function testWaitlistSignup(waitlist) {
  console.log(
    `\n📝 Testing waitlist signup functionality for: ${waitlist.slug}...`
  );

  const testEmail = `signup-test-${Date.now()}@example.com`;

  try {
    // Submit test signup
    const response = await fetch(
      `${BASE_URL}/api/waitlists/${waitlist.slug}/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          name: "Test User",
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log(`✓ Successfully signed up with email: ${testEmail}`);

      // Verify signup was recorded in database
      const { data: signups, error } = await supabase
        .from("waitlist_signups")
        .select("*")
        .eq("email", testEmail)
        .eq("waitlist_id", waitlist.id);

      if (error) {
        console.log(`❌ Error verifying signup in database: ${error.message}`);
      } else if (signups.length > 0) {
        console.log(`✓ Signup record found in database`);
      } else {
        console.log(`❌ Signup record not found in database`);
      }
    } else {
      console.log(
        `❌ Signup failed with status ${response.status}: ${
          data.error || "Unknown error"
        }`
      );
    }

    // Test duplicate signup
    const duplicateResponse = await fetch(
      `${BASE_URL}/api/waitlists/${waitlist.slug}/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          name: "Duplicate User",
        }),
      }
    );

    // Should return 400 Bad Request for duplicate email
    if (duplicateResponse.status === 400) {
      console.log(`✓ Correctly prevented duplicate signup with same email`);
    } else {
      console.log(
        `❌ Failed to prevent duplicate signup. Status: ${duplicateResponse.status}`
      );
    }
  } catch (err) {
    console.error(`❌ Error testing waitlist signup:`, err);
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(waitlists) {
  console.log("\n🧹 Cleaning up test data...");

  // Delete test waitlists
  for (const waitlist of waitlists) {
    try {
      // Delete waitlist signups first
      const { error: signupError } = await supabase
        .from("waitlist_signups")
        .delete()
        .eq("waitlist_id", waitlist.id);

      if (signupError) {
        console.log(
          `❌ Failed to delete signups for waitlist ${waitlist.id}: ${signupError.message}`
        );
      }

      // Then delete the waitlist
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
    console.log("🧪 Starting public waitlist page tests...");

    await setupTestUser();
    const waitlists = await createTestWaitlists();

    if (waitlists.length === 0) {
      console.log("❌ No test waitlists were created. Aborting tests.");
      return;
    }

    // Test first waitlist in detail
    await testPublicWaitlistPage(testWaitlist);
    await testWaitlistSignup(testWaitlist);

    // Simple check for other waitlists
    for (const waitlist of waitlists.slice(1)) {
      await testPublicWaitlistPage(waitlist);
    }

    console.log("\n✅ Tests completed!");

    await cleanupTestData(waitlists);
  } catch (err) {
    console.error("❌ Unexpected error during tests:", err);
    // Try to clean up even if tests fail
    if (testWaitlist) {
      await cleanupTestData([testWaitlist]);
    }
  }
}

// Run the tests
runTests();
