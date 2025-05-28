const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Also load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Handle ESM modules in CommonJS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testAnalyticsAPI() {
  console.log("🧪 Testing Analytics API Implementation...\n");

  // Test waitlist ID that has signups
  const testWaitlistId = "45263dea-47ed-4a06-9fcc-409941212c6f";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Testing waitlist ID: ${testWaitlistId}\n`);

  try {
    // Test the analytics API endpoint
    console.log("📊 Testing analytics API endpoint...");
    const response = await fetch(
      `${baseUrl}/api/waitlists/${testWaitlistId}/analytics`
    );

    console.log(`Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log(`✅ Analytics API Response received`);

    // Validate the response structure
    console.log("\n📋 Validating response structure...");

    const requiredFields = ["waitlist", "metrics", "charts", "recentSignups"];

    for (const field of requiredFields) {
      if (data[field]) {
        console.log(`✅ ${field}: Present`);
      } else {
        console.log(`❌ ${field}: Missing`);
      }
    }

    // Check metrics structure
    if (data.metrics) {
      console.log("\n📈 Metrics data:");
      console.log(`  Total Signups: ${data.metrics.totalSignups}`);
      console.log(`  Pending Signups: ${data.metrics.pendingSignups}`);
      console.log(`  Approved Signups: ${data.metrics.approvedSignups}`);
      console.log(`  Conversion Rate: ${data.metrics.conversionRate}`);
      console.log(`  Avg Time on Waitlist: ${data.metrics.avgTimeOnWaitlist}`);
    }

    // Check charts data
    if (data.charts) {
      console.log("\n📊 Charts data:");
      console.log(
        `  Daily Signups entries: ${data.charts.dailySignups?.length || 0}`
      );
      console.log(
        `  Referral Sources entries: ${data.charts.referralSources?.length || 0}`
      );

      if (data.charts.dailySignups?.length > 0) {
        console.log(
          `  Sample daily signup: ${JSON.stringify(data.charts.dailySignups[0])}`
        );
      }

      if (data.charts.referralSources?.length > 0) {
        console.log(
          `  Sample referral source: ${JSON.stringify(data.charts.referralSources[0])}`
        );
      }
    }

    // Check recent signups
    if (data.recentSignups) {
      console.log("\n👥 Recent signups:");
      console.log(`  Count: ${data.recentSignups.length}`);
      if (data.recentSignups.length > 0) {
        console.log(
          `  Sample signup: ${JSON.stringify(data.recentSignups[0])}`
        );
      }
    }

    // Check waitlist info
    if (data.waitlist) {
      console.log("\n📝 Waitlist info:");
      console.log(`  Name: ${data.waitlist.name}`);
      console.log(`  Status: ${data.waitlist.status}`);
      console.log(`  Published: ${data.waitlist.published}`);
    }

    console.log("\n✅ Analytics API test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testAnalyticsAPI().catch(console.error);
