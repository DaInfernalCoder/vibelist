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

// Handle ESM modules in CommonJS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testWebhookFlow() {
  console.log("=== STRIPE WEBHOOK DEBUG TEST ===");
  console.log(
    `Testing webhook at: ${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/webhook/stripe`
  );

  // Check required environment variables
  const requiredEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  console.log("\n=== ENVIRONMENT CHECK ===");
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    console.log(`${envVar}: ${value ? "✅ Set" : "❌ Missing"}`);
    if (value && envVar.includes("KEY")) {
      console.log(`  Preview: ${value.substring(0, 10)}...`);
    }
  }

  // Get config to check price IDs
  console.log("\n=== STRIPE CONFIGURATION ===");
  try {
    const configModule = await import("./config.js");
    const config = configModule.default;

    console.log("Available plans:");
    config.stripe.plans.forEach((plan, index) => {
      console.log(
        `  ${index + 1}. ${plan.name}: ${plan.priceId} ($${plan.price})`
      );
    });

    // Use the Pro plan for testing
    const testPlan = config.stripe.plans.find((p) => p.name === "Pro");
    if (!testPlan) {
      console.error("❌ Pro plan not found in config");
      return;
    }

    console.log(`\nUsing test plan: ${testPlan.name} (${testPlan.priceId})`);

    // Create a mock checkout session completed event
    const mockEvent = {
      id: "evt_test_webhook_debug",
      object: "event",
      api_version: "2023-08-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_test_debug_session",
          object: "checkout.session",
          amount_total: testPlan.price * 100, // Convert to cents
          currency: "usd",
          customer: "cus_test_debug_customer",
          mode: "payment",
          payment_status: "paid",
          client_reference_id: null, // Will test both with and without user ID
          metadata: {
            source: "vibelist-app", // This is crucial for event filtering
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: "req_test_debug",
        idempotency_key: null,
      },
      type: "checkout.session.completed",
    };

    console.log("\n=== MOCK EVENT DETAILS ===");
    console.log(`Event ID: ${mockEvent.id}`);
    console.log(`Session ID: ${mockEvent.data.object.id}`);
    console.log(`Customer ID: ${mockEvent.data.object.customer}`);
    console.log(`Amount: $${mockEvent.data.object.amount_total / 100}`);
    console.log(`Metadata source: ${mockEvent.data.object.metadata.source}`);

    // Test 1: Without user ID (should create new user)
    console.log("\n=== TEST 1: WITHOUT USER ID ===");
    await testWebhookCall(
      mockEvent,
      "Test without user ID - should create new user"
    );

    // Test 2: With existing user ID
    console.log("\n=== TEST 2: WITH EXISTING USER ID ===");
    // Get an existing user ID from the database
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      mockEvent.data.object.client_reference_id = testUser.id;
      console.log(`Using existing user: ${testUser.email} (${testUser.id})`);
      await testWebhookCall(mockEvent, "Test with existing user ID");
    } else {
      console.log("No existing users found, skipping user ID test");
    }
  } catch (error) {
    console.error("❌ Error loading config:", error.message);
  }
}

async function testWebhookCall(mockEvent, testDescription) {
  console.log(`\n--- ${testDescription} ---`);

  try {
    // Create the webhook payload
    const payload = JSON.stringify(mockEvent);

    // For testing, we'll create a simple signature (in real scenario, Stripe creates this)
    // Note: This won't pass Stripe's signature verification, but we can modify the webhook temporarily
    const testSignature = "t=1234567890,v1=test_signature_for_debugging";

    console.log(`Payload size: ${payload.length} bytes`);
    console.log(`Payload preview: ${payload.substring(0, 200)}...`);

    const webhookUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/webhook/stripe`;

    console.log(`Calling webhook: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": testSignature,
      },
      body: payload,
    });

    const responseText = await response.text();

    console.log(`Response status: ${response.status}`);
    console.log(
      `Response headers:`,
      Object.fromEntries(response.headers.entries())
    );
    console.log(`Response body: ${responseText}`);

    if (response.status === 400 && responseText.includes("signature")) {
      console.log(
        "\n⚠️  Expected signature verification failure in test environment"
      );
      console.log(
        "This is normal - the webhook is working but rejecting our test signature"
      );
      console.log("To test the full flow, you would need to:");
      console.log(
        "1. Temporarily disable signature verification in the webhook"
      );
      console.log("2. Or use Stripe CLI to send real webhook events");
      console.log(
        "3. Or create a test endpoint that bypasses signature verification"
      );
    }
  } catch (error) {
    console.error(`❌ Error calling webhook:`, error.message);
  }
}

// Additional function to test the Stripe integration directly
async function testStripeIntegration() {
  console.log("\n=== STRIPE INTEGRATION TEST ===");

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });

    // Test Stripe connection
    console.log("Testing Stripe connection...");
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.id}`);
    console.log(`Account country: ${account.country}`);
    console.log(`Account email: ${account.email}`);

    // Test webhook endpoint list
    console.log("\nChecking webhook endpoints...");
    const webhookEndpoints = await stripe.webhookEndpoints.list();
    console.log(`Found ${webhookEndpoints.data.length} webhook endpoints:`);

    webhookEndpoints.data.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint.url}`);
      console.log(`     Status: ${endpoint.status}`);
      console.log(`     Events: ${endpoint.enabled_events.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Stripe integration error:", error.message);
  }
}

// Run the tests
async function runAllTests() {
  await testStripeIntegration();
  await testWebhookFlow();

  console.log("\n=== DEBUGGING RECOMMENDATIONS ===");
  console.log("1. Check Stripe webhook endpoint configuration");
  console.log(
    "2. Verify webhook secret matches between Stripe and environment"
  );
  console.log(
    "3. Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/webhook/stripe"
  );
  console.log("4. Check Supabase RLS policies for profiles table");
  console.log("5. Monitor webhook logs in Stripe dashboard");
  console.log("6. Check server logs during actual payment flow");
}

runAllTests().catch(console.error);
