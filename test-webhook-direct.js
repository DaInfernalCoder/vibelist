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

async function testWebhookDirectly() {
  console.log("=== DIRECT WEBHOOK TEST ===");

  try {
    // Initialize Stripe to get a recent event
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16",
    });

    console.log("\n=== FETCHING RECENT STRIPE EVENT ===");

    // Get recent events from Stripe
    const events = await stripe.events.list({
      limit: 5,
      types: ["checkout.session.completed"],
    });

    if (events.data.length === 0) {
      console.log("❌ No recent checkout.session.completed events found");
      return;
    }

    // Use the most recent event
    const recentEvent = events.data[0];
    console.log(`Using event: ${recentEvent.id}`);
    console.log(`Event type: ${recentEvent.type}`);
    console.log(
      `Created: ${new Date(recentEvent.created * 1000).toISOString()}`
    );

    const session = recentEvent.data.object;
    console.log(`Metadata:`, session.metadata);

    // Test if this event should be processed
    const metadata = session.metadata || {};
    const isVibeListPayment = metadata.source === "vibelist-app";

    if (!isVibeListPayment) {
      console.log("⚠️ This event would be skipped due to filtering");
      return;
    }

    console.log("\n=== CREATING WEBHOOK PAYLOAD ===");

    // Create the webhook payload exactly as Stripe would send it
    const webhookPayload = JSON.stringify(recentEvent);

    // Create a signature (this won't verify, but we can test signature creation)
    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = timestamp + "." + webhookPayload;
    const signature = crypto
      .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
      .update(payload, "utf8")
      .digest("hex");

    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log(`Payload size: ${webhookPayload.length} bytes`);
    console.log(`Signature: ${stripeSignature.substring(0, 50)}...`);

    console.log("\n=== CALLING WEBHOOK ENDPOINT ===");

    // Call our webhook endpoint
    const webhookUrl = process.env.NEXT_PUBLIC_URL
      ? `${process.env.NEXT_PUBLIC_URL}/api/webhook/stripe`
      : "http://localhost:3000/api/webhook/stripe";

    console.log(`Webhook URL: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": stripeSignature,
        "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      },
      body: webhookPayload,
    });

    console.log(`Response status: ${response.status}`);
    console.log(
      `Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);

    if (response.ok) {
      console.log("✅ Webhook call successful!");

      // Now check if the user was actually updated
      console.log("\n=== VERIFYING DATABASE UPDATE ===");

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(session.customer);
      console.log(`Checking user: ${customer.email}`);

      // Check database
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "has_access, customer_id, price_id, access_expires_at, updated_at"
        )
        .eq("email", customer.email)
        .single();

      if (error) {
        console.log(`❌ Database check failed: ${error.message}`);
      } else {
        console.log(`Database status for ${customer.email}:`);
        console.log(`- Has access: ${profile.has_access}`);
        console.log(`- Customer ID: ${profile.customer_id || "none"}`);
        console.log(`- Price ID: ${profile.price_id || "none"}`);
        console.log(
          `- Access expires: ${profile.access_expires_at || "never"}`
        );
        console.log(`- Last updated: ${profile.updated_at}`);

        if (profile.has_access && profile.customer_id) {
          console.log("🎉 SUCCESS! User was properly updated by webhook!");
        } else {
          console.log("❌ FAILURE! User was not updated by webhook");
        }
      }
    } else {
      console.log("❌ Webhook call failed!");

      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error details:", errorData);
      } catch (e) {
        console.log("Raw error response:", responseText);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testWebhookDirectly().catch(console.error);
