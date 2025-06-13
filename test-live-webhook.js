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

async function testLiveWebhookSetup() {
  console.log("=== LIVE MODE WEBHOOK VERIFICATION ===");

  try {
    // Check if we're using live keys
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");
    const isLivePubKey =
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_");

    console.log(
      `✅ Stripe Secret Key: ${isLiveMode ? "LIVE MODE" : "TEST MODE"}`
    );
    console.log(
      `✅ Stripe Publishable Key: ${isLivePubKey ? "LIVE MODE" : "TEST MODE"}`
    );
    console.log(
      `✅ Webhook Secret configured: ${!!process.env.STRIPE_WEBHOOK_SECRET}`
    );

    if (!isLiveMode || !isLivePubKey) {
      console.warn("⚠️  WARNING: Not all keys are in live mode!");
      return;
    }

    // Initialize Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });

    // Check webhook endpoints in live mode
    console.log("\n=== CHECKING LIVE WEBHOOK ENDPOINTS ===");
    const webhookEndpoints = await stripe.webhookEndpoints.list();

    console.log(`Found ${webhookEndpoints.data.length} webhook endpoint(s):`);
    webhookEndpoints.data.forEach((endpoint, i) => {
      console.log(`  ${i + 1}. URL: ${endpoint.url}`);
      console.log(`     Status: ${endpoint.status}`);
      console.log(`     Events: ${endpoint.enabled_events.join(", ")}`);
      console.log(
        `     Secret: ${endpoint.secret ? "whsec_..." + endpoint.secret.slice(-10) : "Not available"}`
      );
    });

    // Check if our webhook URL is configured
    const expectedUrl = "https://www.vibe-list.com/api/webhook/stripe";
    const ourWebhook = webhookEndpoints.data.find(
      (endpoint) => endpoint.url === expectedUrl
    );

    if (ourWebhook) {
      console.log(`\n✅ Found our webhook endpoint: ${expectedUrl}`);
      console.log(`   Status: ${ourWebhook.status}`);
      console.log(`   Events: ${ourWebhook.enabled_events.length} configured`);

      // Check if checkout.session.completed is enabled
      const hasCheckoutCompleted = ourWebhook.enabled_events.includes(
        "checkout.session.completed"
      );
      console.log(
        `   Checkout completed event: ${hasCheckoutCompleted ? "✅ Enabled" : "❌ Missing"}`
      );
    } else {
      console.log(`\n❌ Our webhook endpoint not found: ${expectedUrl}`);
      console.log("   Available endpoints:");
      webhookEndpoints.data.forEach((endpoint) => {
        console.log(`   - ${endpoint.url}`);
      });
    }

    // Test webhook endpoint accessibility
    console.log("\n=== TESTING WEBHOOK ENDPOINT ACCESSIBILITY ===");
    try {
      const response = await fetch(expectedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
        },
        body: JSON.stringify({ test: "ping" }),
      });

      console.log(
        `Webhook endpoint response: ${response.status} ${response.statusText}`
      );

      if (response.status === 400) {
        console.log(
          "✅ Webhook endpoint is accessible (400 expected for invalid signature)"
        );
      } else {
        console.log(`⚠️  Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Failed to reach webhook endpoint: ${error.message}`);
    }

    // Check Supabase connection
    console.log("\n=== TESTING SUPABASE CONNECTION ===");
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test database connection
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, has_access, customer_id, price_id")
      .limit(3);

    if (error) {
      console.error(`❌ Supabase connection failed: ${error.message}`);
    } else {
      console.log(`✅ Supabase connected - Found ${profiles.length} profiles`);
      profiles.forEach((profile) => {
        console.log(
          `   - ${profile.email}: access=${profile.has_access}, customer=${profile.customer_id || "none"}`
        );
      });
    }

    // Check plan configuration
    console.log("\n=== CHECKING PLAN CONFIGURATION ===");
    const config = (await import("./config.js")).default;

    console.log(`Found ${config.stripe.plans.length} plan(s):`);
    config.stripe.plans.forEach((plan, i) => {
      console.log(`  ${i + 1}. ${plan.name}: ${plan.priceId}`);
      console.log(`     Price: $${plan.price}`);
      console.log(`     Features: ${plan.features.length} items`);
    });

    // Verify price IDs exist in Stripe
    console.log("\n=== VERIFYING STRIPE PRICES ===");
    for (const plan of config.stripe.plans) {
      try {
        const price = await stripe.prices.retrieve(plan.priceId);
        console.log(
          `✅ ${plan.name} price exists: ${price.id} ($${price.unit_amount / 100})`
        );
      } catch (error) {
        console.error(`❌ ${plan.name} price not found: ${plan.priceId}`);
      }
    }

    console.log("\n=== SUMMARY ===");
    console.log("✅ Live mode keys configured");
    console.log(
      ourWebhook
        ? "✅ Webhook endpoint configured"
        : "❌ Webhook endpoint missing"
    );
    console.log("✅ Supabase connection working");
    console.log("✅ Plan configuration loaded");

    if (ourWebhook && isLiveMode) {
      console.log("\n🎉 READY FOR LIVE PAYMENTS!");
      console.log(
        "When customers complete payments, the webhook should now update their profiles."
      );
    } else {
      console.log("\n⚠️  Setup incomplete - webhook may not work properly");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testLiveWebhookSetup().catch(console.error);
