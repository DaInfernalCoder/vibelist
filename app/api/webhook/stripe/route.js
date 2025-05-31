import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req) {
  const body = await req.text();

  const signature = headers().get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject = event.data.object;

        console.log(
          `[Webhook] Processing checkout.session.completed for session: ${stripeObject.id}`
        );

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        console.log(
          `[Webhook] Session details - Customer: ${customerId}, Price: ${priceId}, User: ${userId}, Plan: ${plan?.name}`
        );

        const customer = await stripe.customers.retrieve(customerId);

        if (!plan) {
          console.error(`[Webhook] No plan found for priceId: ${priceId}`);
          break;
        }

        let user;
        if (!userId) {
          console.log(
            `[Webhook] No userId provided, looking up user by email: ${customer.email}`
          );
          // check if user already exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", customer.email)
            .single();
          if (profile) {
            user = profile;
            console.log(`[Webhook] Found existing user profile: ${profile.id}`);
          } else {
            console.log(
              `[Webhook] Creating new user for email: ${customer.email}`
            );
            // create a new user using supabase auth admin
            const { data } = await supabase.auth.admin.createUser({
              email: customer.email,
            });

            user = data?.user;
            console.log(`[Webhook] Created new user: ${user?.id}`);
          }
        } else {
          console.log(`[Webhook] Looking up user by ID: ${userId}`);
          // find user by ID
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          user = profile;
          console.log(`[Webhook] Found user profile: ${user?.id}`);
        }

        if (!user?.id) {
          console.error(
            `[Webhook] Failed to find or create user for session: ${stripeObject.id}`
          );
          break;
        }

        // Determine access expiration based on plan
        let accessExpiresAt = null;
        if (plan.name === "Pro") {
          // Pro plan: one year access
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          accessExpiresAt = oneYearFromNow.toISOString();
        }
        // Hacker plan: lifetime access (accessExpiresAt remains null)

        console.log(
          `[Webhook] Updating user ${user.id} with access - Plan: ${plan.name}, Expires: ${accessExpiresAt}`
        );

        // Use a transaction-like approach to ensure atomic updates
        const { data: updateResult, error: updateError } = await supabase
          .from("profiles")
          .update({
            customer_id: customerId,
            price_id: priceId,
            has_access: true,
            access_expires_at: accessExpiresAt,
            updated_at: new Date().toISOString(), // Force updated timestamp
          })
          .eq("id", user?.id)
          .select();

        if (updateError) {
          console.error(
            `[Webhook] Failed to update user profile: ${updateError.message}`
          );
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(
          `[Webhook] Successfully updated user ${user.id} subscription status:`,
          updateResult
        );

        // Verify the update was successful
        const { data: verifyProfile } = await supabase
          .from("profiles")
          .select("has_access, access_expires_at, customer_id, price_id")
          .eq("id", user.id)
          .single();

        console.log(
          `[Webhook] Verification - User ${user.id} current status:`,
          verifyProfile
        );

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        await supabase
          .from("profiles")
          .update({ has_access: false })
          .eq("customer_id", subscription.customer);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject = event.data.object;
        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer;

        console.log(
          `[Webhook] Processing invoice.paid for customer: ${customerId}, price: ${priceId}`
        );

        // Find profile where customer_id equals the customerId (in table called 'profiles')
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error(
            `[Webhook] Failed to find profile for customer ${customerId}:`,
            profileError
          );
          break;
        }

        console.log(
          `[Webhook] Found profile for customer ${customerId}: ${profile.id}`
        );

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (profile.price_id !== priceId) {
          console.warn(
            `[Webhook] Price mismatch - Profile: ${profile.price_id}, Invoice: ${priceId}`
          );
          break;
        }

        // Grant the profile access to your product. It's a boolean in the database, but could be a number of credits, etc...
        const { data: updateResult, error: updateError } = await supabase
          .from("profiles")
          .update({
            has_access: true,
            updated_at: new Date().toISOString(), // Force updated timestamp
          })
          .eq("customer_id", customerId)
          .select();

        if (updateError) {
          console.error(
            `[Webhook] Failed to update profile for customer ${customerId}:`,
            updateError
          );
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(
          `[Webhook] Successfully granted access to customer ${customerId}:`,
          updateResult
        );

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}
