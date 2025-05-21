/**
 * Utility script to get a test access token
 *
 * This script creates a test user and prints their access token
 * which can be used in other test scripts.
 *
 * Usage:
 * node scripts/get-test-token.js
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTestToken() {
  console.log("🔑 Creating test user and generating access token...");

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

    console.log(`✓ Created test user: ${data.user.id} (${data.user.email})`);

    // Sign in to get a session
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      throw new Error(`Failed to sign in as test user: ${signInError.message}`);
    }

    console.log("\n✅ SUCCESS! Use this access token in your test scripts:\n");
    console.log(sessionData.session.access_token);
    console.log(
      "\nTo use this token in a test script, add this line at the top:"
    );
    console.log(`config.accessToken = "YOUR_TOKEN_HERE";\n`);
    console.log("⚠️ This token will expire, so generate a new one when needed");
    console.log("⚠️ Remember to clean up test users after testing");

    return sessionData.session.access_token;
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

// Run the function
getTestToken();
