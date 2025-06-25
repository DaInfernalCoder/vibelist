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

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testWebhookWithRealEvent() {
  console.log("=== MANUAL WEBHOOK TEST ===");

  try {
    // Initialize Stripe to get recent events
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });

    console.log("\n=== FETCHING RECENT STRIPE EVENTS ===");

    // Get recent events from Stripe
    const events = await stripe.events.list({
      limit: 10,
      types: ["checkout.session.completed"],
    });

    console.log(
      `Found ${events.data.length} recent checkout.session.completed events`
    );

    if (events.data.length === 0) {
      console.log("❌ No recent checkout.session.completed events found");
      console.log("💡 This means either:");
      console.log("  1. No recent payments have been made");
      console.log("  2. Payments were made but events aren't being created");
      return;
    }

    // Use the most recent event
    const recentEvent = events.data[0];
    console.log(`\n=== USING RECENT EVENT ===`);
    console.log(`Event ID: ${recentEvent.id}`);
    console.log(
      `Created: ${new Date(recentEvent.created * 1000).toISOString()}`
    );
    console.log(`Type: ${recentEvent.type}`);

    const session = recentEvent.data.object;
    console.log(`Session ID: ${session.id}`);
    console.log(`Payment Status: ${session.payment_status}`);
    console.log(`Customer: ${session.customer}`);
    console.log(`Client Reference ID: ${session.client_reference_id}`);
    console.log(`Metadata:`, session.metadata);

    // Test if this event would pass our filtering
    const metadata = session.metadata || {};
    const isVibeListPayment = metadata.source === "vibelist-app";

    console.log(`\n=== EVENT FILTERING CHECK ===`);
    console.log(`Source: ${metadata.source}`);
    console.log(`Is VibeList payment: ${isVibeListPayment}`);

    if (!isVibeListPayment) {
      console.log(
        "⚠️  This event would be SKIPPED by your webhook due to filtering!"
      );
      console.log(
        "💡 This is likely the issue - payments aren't being tagged with 'vibelist-app' metadata"
      );

      // Check all recent events to see if any have the right metadata
      console.log("\n=== CHECKING ALL RECENT EVENTS FOR METADATA ===");
      for (const event of events.data) {
        const eventSession = event.data.object;
        const eventMetadata = eventSession.metadata || {};
        console.log(
          `Event ${event.id}: source=${eventMetadata.source || "none"}`
        );
      }

      return;
    }

    // If we get here, the event should work
    console.log("✅ This event should be processed by your webhook");

    // Check if user exists in database
    console.log("\n=== CHECKING USER IN DATABASE ===");
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(session.customer);
    console.log(`Customer email: ${customer.email}`);

    // Check if user exists in profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", customer.email)
      .single();

    if (error) {
      console.log(`❌ User not found in database: ${customer.email}`);
      console.log("💡 This means the webhook would try to create a new user");
    } else {
      console.log(`✅ User found in database: ${profile.email}`);
      console.log(`Current access: ${profile.has_access}`);
      console.log(`Customer ID: ${profile.customer_id || "none"}`);
      console.log(`Price ID: ${profile.price_id || "none"}`);
    }

    // Check webhook delivery attempts in Stripe
    console.log("\n=== CHECKING WEBHOOK DELIVERY ATTEMPTS ===");
    try {
      const webhookEndpoints = await stripe.webhookEndpoints.list();
      const ourEndpoint = webhookEndpoints.data.find(
        (endpoint) =>
          endpoint.url === "https://www.vibe-list.com/api/webhook/stripe"
      );

      if (ourEndpoint) {
        console.log(`Webhook endpoint ID: ${ourEndpoint.id}`);
        console.log(`Status: ${ourEndpoint.status}`);

        // Note: We can't directly access delivery attempts via API,
        // but we can suggest checking the Stripe dashboard
        console.log("\n💡 To check if webhooks are being delivered:");
        console.log("1. Go to Stripe Dashboard > Developers > Webhooks");
        console.log(`2. Click on your webhook endpoint: ${ourEndpoint.url}`);
        console.log("3. Check the 'Attempts' tab for recent delivery attempts");
        console.log("4. Look for any failed deliveries or error messages");
      }
    } catch (error) {
      console.log(`Error checking webhook endpoints: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testWebhookWithRealEvent().catch(console.error);
