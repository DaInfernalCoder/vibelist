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

async function checkWebhookConfiguration() {
  console.log("=== WEBHOOK CONFIGURATION CHECK ===");

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });

    // Check webhook endpoints
    console.log("Checking Stripe webhook endpoints...");
    const webhookEndpoints = await stripe.webhookEndpoints.list();

    if (webhookEndpoints.data.length === 0) {
      console.log("❌ NO WEBHOOK ENDPOINTS CONFIGURED!");
      console.log(
        "\nThis is the main issue! Stripe is not sending webhook events to your application."
      );
      console.log("\nTo fix this, you need to:");
      console.log("1. Go to your Stripe Dashboard");
      console.log("2. Navigate to Developers > Webhooks");
      console.log("3. Click 'Add endpoint'");
      console.log(
        "4. Set the endpoint URL to: https://your-domain.com/api/webhook/stripe"
      );
      console.log(
        "   (For local testing: use ngrok or similar to expose localhost)"
      );
      console.log("5. Select these events to listen for:");
      console.log("   - checkout.session.completed");
      console.log("   - checkout.session.expired");
      console.log("   - customer.subscription.updated");
      console.log("   - customer.subscription.deleted");
      console.log("   - invoice.paid");
      console.log("   - invoice.payment_failed");
      console.log(
        "6. Copy the webhook signing secret to your STRIPE_WEBHOOK_SECRET environment variable"
      );

      return false;
    } else {
      console.log(
        `✅ Found ${webhookEndpoints.data.length} webhook endpoint(s):`
      );
      webhookEndpoints.data.forEach((endpoint, index) => {
        console.log(`\n  ${index + 1}. ${endpoint.url}`);
        console.log(`     Status: ${endpoint.status}`);
        console.log(`     Events: ${endpoint.enabled_events.join(", ")}`);
        console.log(
          `     Created: ${new Date(endpoint.created * 1000).toISOString()}`
        );
      });
      return true;
    }
  } catch (error) {
    console.error("❌ Error checking webhook configuration:", error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log("\n=== DATABASE CONNECTION TEST ===");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test database connection
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, has_access, customer_id")
      .limit(3);

    if (error) {
      console.error("❌ Database connection failed:", error.message);
      return false;
    }

    console.log(`✅ Database connection successful`);
    console.log(`Found ${data.length} profiles in database`);

    // Check if any profiles have payment data
    const paidProfiles = data.filter((p) => p.customer_id || p.has_access);
    console.log(`Profiles with payment data: ${paidProfiles.length}`);

    if (paidProfiles.length === 0) {
      console.log(
        "⚠️  No profiles have payment data - this confirms webhook isn't working"
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log("\n=== ENVIRONMENT VARIABLES CHECK ===");

  const requiredVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function runDiagnostics() {
  console.log("=== STRIPE WEBHOOK DIAGNOSTICS ===\n");

  const envOk = await checkEnvironmentVariables();
  const dbOk = await testDatabaseConnection();
  const webhookOk = await checkWebhookConfiguration();

  console.log("\n=== SUMMARY ===");
  console.log(`Environment Variables: ${envOk ? "✅" : "❌"}`);
  console.log(`Database Connection: ${dbOk ? "✅" : "❌"}`);
  console.log(`Webhook Configuration: ${webhookOk ? "✅" : "❌"}`);

  if (!webhookOk) {
    console.log(
      "\n🔥 MAIN ISSUE IDENTIFIED: No webhook endpoints configured in Stripe!"
    );
    console.log(
      "This explains why user profiles aren't being updated after payments."
    );
    console.log("Stripe is not sending webhook events to your application.");
  } else if (envOk && dbOk && webhookOk) {
    console.log("\n✅ All basic configuration looks good.");
    console.log(
      "The issue might be in the webhook processing logic or RLS policies."
    );
  }

  console.log("\n=== NEXT STEPS ===");
  if (!webhookOk) {
    console.log("1. Configure webhook endpoint in Stripe Dashboard");
    console.log("2. Test with a real payment or Stripe CLI");
  } else {
    console.log(
      "1. Test webhook with Stripe CLI: stripe listen --forward-to localhost:3000/api/webhook/stripe"
    );
    console.log("2. Make a test payment and monitor logs");
    console.log("3. Check webhook event delivery in Stripe Dashboard");
  }
}

runDiagnostics().catch(console.error);
