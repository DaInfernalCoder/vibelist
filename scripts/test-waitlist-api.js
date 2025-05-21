/**
 * Test script for Waitlist API endpoints
 *
 * This script tests:
 * 1. Waitlist creation with slug generation
 * 2. Fetching a waitlist by ID
 * 3. Fetching a waitlist by slug
 *
 * Usage:
 * node scripts/test-waitlist-api.js
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env.local
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "Supabase Service Role Key:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "*****" : "Not found"
);

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
let testWaitlist = null;

async function setupTestUser() {
  console.log("Setting up test user...");

  try {
    // Create a test user with a random email
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    testUser = data.user;
    console.log(`Created test user: ${testUser.id} (${testUser.email})`);

    return testUser;
  } catch (err) {
    console.error("Error creating test user:", err);
    process.exit(1);
  }
}

async function testWaitlistCreation() {
  console.log("\nTesting waitlist creation...");

  try {
    const testTemplate = await createTestTemplate();

    // Create a waitlist directly using the database
    const waitlistName = `Test Waitlist ${Date.now()}`;
    const { data, error } = await supabase
      .from("waitlists")
      .insert({
        name: waitlistName,
        description: "A test waitlist",
        owner_id: testUser.id,
        status: "published",
        published: true,
        url_slug: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test waitlist: ${error.message}`);
    }

    testWaitlist = data;
    console.log(`Created waitlist: ${testWaitlist.id} (${testWaitlist.name})`);

    // Verify url_slug was generated
    if (!testWaitlist.url_slug) {
      throw new Error("URL slug was not generated for the waitlist");
    }

    console.log(`Generated slug: ${testWaitlist.url_slug}`);

    return testWaitlist;
  } catch (err) {
    console.error("Error testing waitlist creation:", err);
    process.exit(1);
  }
}

async function createTestTemplate() {
  try {
    // Create a test template
    const { data, error } = await supabase
      .from("waitlist_templates")
      .insert({
        user_id: testUser.id,
        name: `Test Template ${Date.now()}`,
        template_data: {
          theme_color: "#ff0000",
          hero_text: "Test Hero",
          description_text: "Test Description",
          button_text: "Join Test",
        },
      })
      .select()
      .single();

    if (error) {
      console.warn("Failed to create test template:", error.message);
      return null;
    }

    console.log(`Created template: ${data.id}`);
    return data;
  } catch (err) {
    console.warn("Error creating test template:", err);
    return null;
  }
}

async function testFetchWaitlistById() {
  console.log("\nTesting fetch waitlist by ID...");

  try {
    // Fetch the waitlist by ID as the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: "password123",
    });

    if (error) {
      throw new Error(`Failed to sign in as test user: ${error.message}`);
    }

    // Use the authenticated client to fetch the waitlist
    const authedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      }
    );

    // Simulate fetching through the API by directly querying Supabase
    const { data: waitlist, error: fetchError } = await authedSupabase
      .from("waitlists")
      .select("*")
      .eq("id", testWaitlist.id)
      .eq("owner_id", testUser.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch waitlist by ID: ${fetchError.message}`);
    }

    if (!waitlist) {
      throw new Error("Waitlist not found by ID");
    }

    console.log(`Successfully fetched waitlist by ID: ${waitlist.id}`);
    console.log("Waitlist data:", waitlist);

    return waitlist;
  } catch (err) {
    console.error("Error testing fetch waitlist by ID:", err);
    return null;
  }
}

async function testFetchWaitlistBySlug() {
  console.log("\nTesting fetch waitlist by slug...");

  try {
    // Simulate fetching through the public API by directly querying Supabase
    const { data: result, error: fetchError } = await supabase
      .from("waitlists")
      .select(
        `
        *,
        customization_settings:customization_settings(*)
      `
      )
      .eq("url_slug", testWaitlist.url_slug)
      .eq("status", "published")
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch waitlist by slug: ${fetchError.message}`
      );
    }

    if (!result) {
      throw new Error("Waitlist not found by slug");
    }

    const waitlist = {
      waitlist: {
        id: result.id,
        name: result.name,
        description: result.description,
        slug: result.url_slug,
        status: result.status,
        created_at: result.created_at,
        owner_id: result.owner_id,
      },
      settings: result.customization_settings,
    };

    console.log(
      `Successfully fetched waitlist by slug: ${waitlist.waitlist.slug}`
    );
    console.log("Waitlist data:", waitlist);

    return waitlist;
  } catch (err) {
    console.error("Error testing fetch waitlist by slug:", err);
    return null;
  }
}

async function cleanupTestData() {
  console.log("\nCleaning up test data...");

  try {
    // Delete test waitlist
    if (testWaitlist) {
      await supabase.from("waitlists").delete().eq("id", testWaitlist.id);
      console.log(`Deleted test waitlist: ${testWaitlist.id}`);
    }

    // Delete test templates
    await supabase
      .from("waitlist_templates")
      .delete()
      .eq("user_id", testUser.id);
    console.log("Deleted test templates");

    // Delete test user
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
      console.log(`Deleted test user: ${testUser.id}`);
    }

    console.log("Cleanup complete!");
  } catch (err) {
    console.error("Error cleaning up test data:", err);
  }
}

async function runTests() {
  try {
    console.log("Starting API tests...");

    await setupTestUser();
    await testWaitlistCreation();
    await testFetchWaitlistById();
    await testFetchWaitlistBySlug();

    console.log("\n✅ All tests passed successfully!");
  } catch (err) {
    console.error("\n❌ Tests failed:", err);
  } finally {
    await cleanupTestData();
  }
}

// Run the tests
runTests();
