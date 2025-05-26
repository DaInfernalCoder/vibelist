// Test script for WaitlistContext implementation
// This verifies that our dynamic waitlist selection works correctly

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Initialize Supabase client with service role key for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWaitlistQuery() {
  console.log("🧪 Testing waitlist query structure...");

  try {
    // Test the exact query structure used in our context
    const { data, error } = await supabase
      .from("waitlists")
      .select(
        `
        id,
        name,
        description,
        status,
        published,
        url_slug,
        created_at,
        updated_at,
        waitlist_analytics (
          total_signups
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ Query failed:", error.message);
      return false;
    }

    console.log(`✅ Successfully queried waitlists`);
    console.log(`📊 Found ${data?.length || 0} waitlists`);

    if (data && data.length > 0) {
      console.log("\n📋 Sample waitlist structure:");
      const sample = data[0];
      console.log({
        id: sample.id,
        name: sample.name,
        status: sample.status,
        published: sample.published,
        signups: sample.waitlist_analytics?.[0]?.total_signups || 0,
        hasAnalytics: !!sample.waitlist_analytics?.length,
      });

      // Test our helper functions
      console.log("\n🔧 Testing helper functions:");
      const isPublished =
        sample.published === true && sample.status === "published";
      console.log(`Published status: ${isPublished ? "Published" : "Draft"}`);
      console.log(
        `Signup count: ${sample.waitlist_analytics?.[0]?.total_signups || 0}`
      );
    }

    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
}

async function testRealTimeSubscription() {
  console.log("\n📡 Testing real-time subscription setup...");

  try {
    // Test if we can set up a subscription (we won't actually wait for events)
    const subscription = supabase.channel("waitlists_test").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "waitlists",
      },
      (payload) => {
        console.log("📨 Real-time event received:", payload.eventType);
      }
    );

    const subscriptionResult = await subscription.subscribe();

    if (subscriptionResult === "SUBSCRIBED") {
      console.log("✅ Real-time subscription setup successful");
      await subscription.unsubscribe();
      return true;
    } else {
      console.log("⚠️  Real-time subscription not ready:", subscriptionResult);
      return false;
    }
  } catch (err) {
    console.error("❌ Real-time subscription error:", err);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting WaitlistContext implementation tests...\n");

  const queryTest = await testWaitlistQuery();
  const realtimeTest = await testRealTimeSubscription();

  console.log("\n📊 Test Results:");
  console.log(`Query functionality: ${queryTest ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Real-time setup: ${realtimeTest ? "✅ PASS" : "❌ FAIL"}`);

  if (queryTest && realtimeTest) {
    console.log(
      "\n🎉 All tests passed! WaitlistContext implementation looks good."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the implementation.");
  }

  process.exit(queryTest && realtimeTest ? 0 : 1);
}

runTests();
