/**
 * Test script for the /api/lead API route
 *
 * This script tests the waitlist signup functionality by:
 * 1. Making sure validation works correctly
 * 2. Testing successful signup
 * 3. Testing duplicate prevention
 *
 * To run the test:
 * node scripts/test-lead-api.js
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");
const fs = require("fs");

// Load environment variables from .env and .env.local
dotenv.config();
// Also load from .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Configuration
const config = {
  baseUrl: "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin operations
};

console.log("Testing with URL:", config.baseUrl);
console.log("Supabase URL available:", !!config.supabaseUrl);
console.log("Supabase key available:", !!config.supabaseKey);
console.log("Service key available:", !!config.serviceKey);

// Initialize Supabase clients
const supabase = createClient(config.supabaseUrl, config.supabaseKey);
// Admin client with service role for operations that require bypassing RLS
const adminSupabase = config.serviceKey
  ? createClient(config.supabaseUrl, config.serviceKey)
  : null;

// Main test function
async function runTests() {
  console.log("🧪 Testing /api/lead API route for waitlist signups\n");

  // Check if we have the admin client
  if (!adminSupabase) {
    console.log(
      "❌ Service role key not available, some tests will be limited"
    );
  }

  // Find or create a test waitlist
  const testWaitlist = await findOrCreateTestWaitlist();

  if (!testWaitlist) {
    console.log("❌ Failed to set up test waitlist, tests aborted");
    process.exit(1);
  }

  try {
    // Test validation
    await testValidation(testWaitlist.id);

    // Test successful signup
    await testSuccessfulSignup(testWaitlist.id);

    // Test duplicate prevention
    await testDuplicatePrevention(testWaitlist.id);

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Tests failed:", error);
  } finally {
    // Clean up - only if we created a test waitlist and have admin access
    if (testWaitlist && testWaitlist.isNew && adminSupabase) {
      await cleanupTestData(testWaitlist.id);
    }
  }
}

// Find an existing waitlist or create a new one for testing
async function findOrCreateTestWaitlist() {
  console.log("📝 Setting up test waitlist...");

  try {
    // First, try to find an existing published waitlist
    const { data: existingWaitlists, error: findError } = await supabase
      .from("waitlists")
      .select("id, name, published")
      .eq("published", true)
      .limit(1);

    if (!findError && existingWaitlists && existingWaitlists.length > 0) {
      console.log(
        `✅ Found existing waitlist to use: ${existingWaitlists[0].name} (${existingWaitlists[0].id})`
      );
      return { ...existingWaitlists[0], isNew: false };
    }

    // If no existing waitlist found and we have admin access, create one
    if (adminSupabase) {
      console.log("No existing published waitlist found, creating one...");

      // Find a profile to use as owner
      const { data: profiles, error: profilesError } = await adminSupabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (profilesError || !profiles || profiles.length === 0) {
        console.error(
          "Failed to find a profile to use as owner:",
          profilesError?.message || "No profiles found"
        );
        return null;
      }

      const ownerId = profiles[0].id;

      // Create test waitlist with admin privileges
      const { data: waitlist, error: waitlistError } = await adminSupabase
        .from("waitlists")
        .insert({
          name: `Test Waitlist ${Date.now()}`,
          description: "A test waitlist for API testing",
          owner_id: ownerId,
          published: true,
          status: "published",
        })
        .select()
        .single();

      if (waitlistError) {
        console.error("Failed to create test waitlist:", waitlistError);
        return null;
      }

      console.log(`✅ Created new test waitlist with ID: ${waitlist.id}`);
      return { ...waitlist, isNew: true };
    } else {
      console.log(
        "❌ No existing waitlists found and cannot create one without service role key"
      );
      return null;
    }
  } catch (error) {
    console.error("Error setting up test waitlist:", error);
    return null;
  }
}

// Test validation on the API
async function testValidation(waitlistId) {
  console.log("\n🧪 Testing API validation...");

  // Test missing email
  const missingEmailResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ waitlistId }),
  });

  const missingEmailData = await missingEmailResponse.json();

  if (
    missingEmailResponse.status === 400 &&
    missingEmailData.error.includes("Email")
  ) {
    console.log("✅ Correctly rejected request with missing email");
  } else {
    console.log(
      `❌ Failed to validate missing email. Status: ${missingEmailResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(missingEmailData)}`);
  }

  // Test missing waitlistId
  const missingWaitlistResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com" }),
  });

  const missingWaitlistData = await missingWaitlistResponse.json();

  if (
    missingWaitlistResponse.status === 400 &&
    missingWaitlistData.error.includes("Waitlist ID")
  ) {
    console.log("✅ Correctly rejected request with missing waitlist ID");
  } else {
    console.log(
      `❌ Failed to validate missing waitlist ID. Status: ${missingWaitlistResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(missingWaitlistData)}`);
  }

  // Test invalid email format
  const invalidEmailResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", waitlistId }),
  });

  const invalidEmailData = await invalidEmailResponse.json();

  if (
    invalidEmailResponse.status === 400 &&
    invalidEmailData.error.includes("Invalid email")
  ) {
    console.log("✅ Correctly rejected invalid email format");
  } else {
    console.log(
      `❌ Failed to validate invalid email. Status: ${invalidEmailResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(invalidEmailData)}`);
  }

  // Test non-existent waitlist
  const fakeWaitlistId = uuidv4();
  const nonExistentResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      waitlistId: fakeWaitlistId,
    }),
  });

  const nonExistentData = await nonExistentResponse.json();

  if (
    nonExistentResponse.status === 404 &&
    nonExistentData.error.includes("not found")
  ) {
    console.log("✅ Correctly rejected non-existent waitlist ID");
  } else {
    console.log(
      `❌ Failed to validate non-existent waitlist. Status: ${nonExistentResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(nonExistentData)}`);
  }
}

// Test successful signup
async function testSuccessfulSignup(waitlistId) {
  console.log("\n🧪 Testing successful signup...");

  const testEmail = `success-test-${Date.now()}@example.com`;

  console.log(`Using waitlist ID: ${waitlistId}`);
  console.log(`Using test email: ${testEmail}`);

  const response = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      name: "Test User",
      waitlistId: waitlistId,
      source: "api_test",
    }),
  });

  const data = await response.json();

  if (response.ok && data.success) {
    console.log(`✅ Successfully signed up with email: ${testEmail}`);

    // Verify in database using admin client to bypass RLS
    const client = adminSupabase || supabase;
    const { data: signups, error } = await client
      .from("waitlist_signups")
      .select("*")
      .eq("email", testEmail)
      .eq("waitlist_id", waitlistId);

    if (error) {
      console.log(`❌ Error verifying signup in database: ${error.message}`);
    } else if (signups && signups.length > 0) {
      console.log(
        `✅ Signup correctly recorded in database with ID: ${signups[0].id}`
      );
    } else {
      console.log(`❌ Signup not found in database`);
    }
  } else {
    console.log(`❌ Failed to sign up. Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
  }
}

// Test duplicate prevention
async function testDuplicatePrevention(waitlistId) {
  console.log("\n🧪 Testing duplicate signup prevention...");

  const testEmail = `duplicate-test-${Date.now()}@example.com`;

  console.log(`Using waitlist ID: ${waitlistId}`);
  console.log(`Using test email: ${testEmail}`);

  // First signup
  const firstResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      waitlistId: waitlistId,
    }),
  });

  const firstData = await firstResponse.json();

  if (!firstResponse.ok) {
    console.log(
      `❌ First signup failed unexpectedly. Status: ${firstResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(firstData)}`);
    return;
  }

  console.log(`✅ First signup successful with email: ${testEmail}`);

  // Attempt duplicate signup
  const duplicateResponse = await fetch(`${config.baseUrl}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      waitlistId: waitlistId,
    }),
  });

  const duplicateData = await duplicateResponse.json();

  if (
    duplicateResponse.status === 409 &&
    duplicateData.error.includes("already registered")
  ) {
    console.log(`✅ Correctly rejected duplicate signup`);
  } else {
    console.log(
      `❌ Failed to prevent duplicate signup. Status: ${duplicateResponse.status}`
    );
    console.log(`Response: ${JSON.stringify(duplicateData)}`);
  }
}

// Clean up test data
async function cleanupTestData(waitlistId) {
  console.log("\n🧹 Cleaning up test data...");

  if (!adminSupabase) {
    console.log("⚠️ Skipping cleanup: No admin access to delete test data");
    return;
  }

  try {
    // Delete waitlist (this should cascade to delete signups)
    const { error } = await adminSupabase
      .from("waitlists")
      .delete()
      .eq("id", waitlistId);

    if (error) {
      console.error(`Error cleaning up waitlist data: ${error.message}`);
    } else {
      console.log(`✅ Test waitlist and associated data cleaned up`);
    }
  } catch (error) {
    console.error("Error in cleanup:", error);
  }
}

// Run tests
runTests().catch(console.error);
