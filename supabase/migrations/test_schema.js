#!/usr/bin/env node

// This script tests the database schema by performing basic operations
// Usage: node test_schema.js

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client with service role key for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function runTests() {
  console.log("Starting schema tests...");
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Check if tables exist
  async function testTablesExist() {
    try {
      const tables = [
        "profiles",
        "waitlists",
        "waitlist_signups",
        "customization_settings",
        "waitlist_analytics",
      ];
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .in("table_name", tables)
        .eq("table_schema", "public");

      if (error) throw error;

      // Check if all tables are present
      const foundTables = data.map((row) => row.table_name);
      const missingTables = tables.filter(
        (table) => !foundTables.includes(table)
      );

      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(", ")}`);
      }

      return {
        status: "passed",
        message: `All tables exist: ${tables.join(", ")}`,
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to verify tables: ${error.message}`,
      };
    }
  }

  // Test 2: Create test user and profile
  async function testUserCreation() {
    try {
      // Create a test user with a random email
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: userData, error: userError } =
        await supabase.auth.admin.createUser({
          email: testEmail,
          password: "password123",
          email_confirm: true,
        });

      if (userError) throw userError;

      const userId = userData.user.id;

      // Check if profile was automatically created
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);

      if (profileError) throw profileError;

      if (!profileData || profileData.length === 0) {
        // Create profile manually if not auto-created
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: userId, email: testEmail, name: "Test User" }]);

        if (insertError) throw insertError;
      }

      return {
        status: "passed",
        message: `Created test user and profile with ID: ${userId}`,
        data: { userId, email: testEmail },
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to create test user: ${error.message}`,
      };
    }
  }

  // Test 3: Create waitlist
  async function testWaitlistCreation(userId) {
    try {
      const { data, error } = await supabase
        .from("waitlists")
        .insert([
          {
            owner_id: userId,
            name: "Test Waitlist",
            description: "A test waitlist created by the schema test script",
            status: "draft",
          },
        ])
        .select();

      if (error) throw error;

      return {
        status: "passed",
        message: `Created test waitlist with ID: ${data[0].id}`,
        data: { waitlistId: data[0].id },
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to create waitlist: ${error.message}`,
      };
    }
  }

  // Test 4: Check customization settings creation
  async function testCustomizationSettings(waitlistId) {
    try {
      const { data, error } = await supabase
        .from("customization_settings")
        .select("*")
        .eq("waitlist_id", waitlistId);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Customization settings were not automatically created"
        );
      }

      return {
        status: "passed",
        message: `Customization settings were automatically created for waitlist ID: ${waitlistId}`,
        data: { settingsId: data[0].id },
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to verify customization settings: ${error.message}`,
      };
    }
  }

  // Test 5: Add waitlist signup
  async function testWaitlistSignup(waitlistId) {
    try {
      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert([
          {
            waitlist_id: waitlistId,
            email: `signup-${Date.now()}@example.com`,
            name: "Test Signup",
            referral_source: "test_script",
          },
        ])
        .select();

      if (error) throw error;

      return {
        status: "passed",
        message: `Created test signup with ID: ${data[0].id}`,
        data: { signupId: data[0].id },
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to create waitlist signup: ${error.message}`,
      };
    }
  }

  // Test 6: Check analytics function
  async function testAnalytics(waitlistId) {
    try {
      const { data, error } = await supabase.rpc("get_waitlist_analytics", {
        p_waitlist_id: waitlistId,
      });

      if (error) throw error;

      return {
        status: "passed",
        message: `Analytics function returned data for waitlist ID: ${waitlistId}`,
        data: { totalSignups: data[0].total_signups },
      };
    } catch (error) {
      return {
        status: "failed",
        message: `Failed to get analytics: ${error.message}`,
      };
    }
  }

  // Run tests sequentially
  try {
    // Test tables
    const tablesTest = await testTablesExist();
    results.tests.push({ name: "Tables Exist", ...tablesTest });
    if (tablesTest.status === "passed") results.passed++;
    else results.failed++;

    // Test user creation
    const userTest = await testUserCreation();
    results.tests.push({ name: "User Creation", ...userTest });
    if (userTest.status === "passed") results.passed++;
    else results.failed++;

    if (userTest.status === "passed") {
      // Test waitlist creation
      const waitlistTest = await testWaitlistCreation(userTest.data.userId);
      results.tests.push({ name: "Waitlist Creation", ...waitlistTest });
      if (waitlistTest.status === "passed") results.passed++;
      else results.failed++;

      if (waitlistTest.status === "passed") {
        // Test customization settings
        const settingsTest = await testCustomizationSettings(
          waitlistTest.data.waitlistId
        );
        results.tests.push({ name: "Customization Settings", ...settingsTest });
        if (settingsTest.status === "passed") results.passed++;
        else results.failed++;

        // Test waitlist signup
        const signupTest = await testWaitlistSignup(
          waitlistTest.data.waitlistId
        );
        results.tests.push({ name: "Waitlist Signup", ...signupTest });
        if (signupTest.status === "passed") results.passed++;
        else results.failed++;

        // Test analytics
        const analyticsTest = await testAnalytics(waitlistTest.data.waitlistId);
        results.tests.push({ name: "Analytics Function", ...analyticsTest });
        if (analyticsTest.status === "passed") results.passed++;
        else results.failed++;
      }
    }
  } catch (error) {
    console.error("Test execution error:", error);
  }

  // Display test results
  console.log("\n----- TEST RESULTS -----");
  console.log(
    `PASSED: ${results.passed} | FAILED: ${results.failed} | TOTAL: ${
      results.passed + results.failed
    }`
  );
  console.log("\nDetailed Results:");

  results.tests.forEach((test) => {
    const icon = test.status === "passed" ? "✅" : "❌";
    console.log(`${icon} ${test.name}: ${test.message}`);
  });

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests();
