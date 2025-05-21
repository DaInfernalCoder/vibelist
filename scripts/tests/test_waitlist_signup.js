/**
 * Test script for waitlist signup functionality
 * This script tests the fix for the GROUP BY error in calculate_daily_signups
 *
 * Usage: node scripts/tests/test_waitlist_signup.js
 */

// Node fetch for making HTTP requests in node environment
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Load environment
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load .env
dotenv.config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Test configuration
const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const testEmail = `test-${Date.now()}@example.com`;
const testName = "Test User";

// Supabase client for direct database operations
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log("Starting waitlist signup test...");
    console.log(`Using base URL: ${baseUrl}`);

    // Get a published waitlist for testing
    const { data: waitlist, error: waitlistError } = await supabase
      .from("waitlists")
      .select("id, name")
      .eq("published", true)
      .limit(1)
      .single();

    if (waitlistError || !waitlist) {
      console.error("Error: No published waitlist found for testing");
      console.error(
        "Please create and publish a waitlist before running this test"
      );
      return;
    }

    console.log(
      `Found waitlist for testing: ${waitlist.name} (${waitlist.id})`
    );

    // Test direct function calls first
    console.log("\n--- Testing database functions ---");

    try {
      // Test fixed calculate_daily_signups function
      const { data: dailySignups, error: signupsError } = await supabase.rpc(
        "calculate_daily_signups",
        { p_waitlist_id: waitlist.id }
      );

      if (signupsError) {
        console.error(
          "Error: calculate_daily_signups function failed:",
          signupsError.message
        );
      } else {
        console.log(
          "Success: calculate_daily_signups function executed without errors"
        );
        console.log(
          `Result type: ${typeof dailySignups}, length: ${Array.isArray(dailySignups) ? dailySignups.length : "N/A"}`
        );
      }

      // Test safe version
      const { data: safeSignups, error: safeError } = await supabase.rpc(
        "calculate_daily_signups_safe",
        { p_waitlist_id: waitlist.id }
      );

      if (safeError) {
        console.error(
          "Error: calculate_daily_signups_safe function failed:",
          safeError.message
        );
      } else {
        console.log(
          "Success: calculate_daily_signups_safe function executed without errors"
        );
        console.log(
          `Result type: ${typeof safeSignups}, length: ${Array.isArray(safeSignups) ? safeSignups.length : "N/A"}`
        );
      }
    } catch (functionError) {
      console.error("Error testing database functions:", functionError.message);
    }

    // Test the API endpoint
    console.log("\n--- Testing API endpoint ---");

    // Prepare test data
    const testData = {
      waitlistId: waitlist.id,
      email: testEmail,
      name: testName,
      source: "test",
    };

    console.log(`Test data: ${JSON.stringify(testData)}`);

    try {
      // Make the API request
      const response = await fetch(`${baseUrl}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      console.log(`Status code: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data)}`);

      if (response.ok) {
        console.log("Success: API endpoint returned successful response");

        // Verify the signup was actually created
        const { data: signup, error: signupError } = await supabase
          .from("waitlist_signups")
          .select("*")
          .eq("waitlist_id", waitlist.id)
          .eq("email", testEmail)
          .maybeSingle();

        if (signupError) {
          console.error(
            "Error verifying signup creation:",
            signupError.message
          );
        } else if (signup) {
          console.log(
            "Success: Signup was successfully created in the database"
          );
          console.log(`Signup record: ${JSON.stringify(signup)}`);
        } else {
          console.error(
            "Error: Signup was not found in the database despite successful API response"
          );
        }
      } else {
        console.error("Error: API endpoint returned error response");
      }
    } catch (apiError) {
      console.error("Error testing API endpoint:", apiError.message);
    }

    // Test toggle_analytics_triggers function
    console.log("\n--- Testing toggle_analytics_triggers function ---");

    try {
      // Disable triggers
      const { data: disableResult, error: disableError } = await supabase.rpc(
        "toggle_analytics_triggers",
        { p_enable: false }
      );

      if (disableError) {
        console.error(
          "Error disabling analytics triggers:",
          disableError.message
        );
      } else {
        console.log("Success: Analytics triggers disabled");
      }

      // Enable triggers
      const { data: enableResult, error: enableError } = await supabase.rpc(
        "toggle_analytics_triggers",
        { p_enable: true }
      );

      if (enableError) {
        console.error(
          "Error enabling analytics triggers:",
          enableError.message
        );
      } else {
        console.log("Success: Analytics triggers re-enabled");
      }
    } catch (toggleError) {
      console.error("Error testing trigger toggle:", toggleError.message);
    }

    console.log("\n--- Test completed ---");
  } catch (error) {
    console.error("Unexpected error during testing:", error.message);
    console.error(error.stack);
  }
}

// Run the tests
runTests();
