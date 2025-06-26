import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Generate correlation ID for tracking requests
function generateCorrelationId() {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req) {
  const correlationId = generateCorrelationId();

  console.log(`[Webhook:${correlationId}] === WEBHOOK REQUEST START ===`);
  console.log(
    `[Webhook:${correlationId}] Timestamp: ${new Date().toISOString()}`
  );
  console.log(
    `[Webhook:${correlationId}] Headers:`,
    Object.fromEntries(req.headers.entries())
  );

  let body;
  let bodyBuffer;

  try {
    body = await req.text();
    bodyBuffer = Buffer.from(body);
    console.log(
      `[Webhook:${correlationId}] Raw body length: ${body.length} characters`
    );
    console.log(
      `[Webhook:${correlationId}] Raw body preview: ${body.substring(0, 200)}...`
    );
  } catch (error) {
    console.error(
      `[Webhook:${correlationId}] Failed to read request body:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  console.log(
    `[Webhook:${correlationId}] Stripe signature present: ${!!signature}`
  );
  console.log(
    `[Webhook:${correlationId}] Webhook secret configured: ${!!webhookSecret}`
  );

  // Validate required components for signature verification
  if (!signature) {
    console.error(
      `[Webhook:${correlationId}] ❌ Missing Stripe signature header`
    );
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error(
      `[Webhook:${correlationId}] ❌ Webhook secret not configured`
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  if (!body || body.length === 0) {
    console.error(`[Webhook:${correlationId}] ❌ Empty request body`);
    return NextResponse.json({ error: "Empty request body" }, { status: 400 });
  }

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log(
    `[Webhook:${correlationId}] Supabase client initialized with service role`
  );

  // verify Stripe event is legit
  try {
    console.log(
      `[Webhook:${correlationId}] Attempting signature verification...`
    );
    console.log(
      `[Webhook:${correlationId}] Body buffer length: ${bodyBuffer.length} bytes`
    );
    console.log(
      `[Webhook:${correlationId}] Signature header: ${signature.substring(0, 50)}...`
    );
    console.log(
      `[Webhook:${correlationId}] Webhook secret prefix: ${webhookSecret.substring(0, 10)}...`
    );

    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      webhookSecret
    );
    console.log(
      `[Webhook:${correlationId}] ✅ Signature verification successful`
    );
    console.log(`[Webhook:${correlationId}] Event ID: ${event.id}`);
    console.log(`[Webhook:${correlationId}] Event type: ${event.type}`);
    console.log(
      `[Webhook:${correlationId}] Event created: ${new Date(event.created * 1000).toISOString()}`
    );
    console.log(`[Webhook:${correlationId}] Event livemode: ${event.livemode}`);
  } catch (err) {
    console.error(
      `[Webhook:${correlationId}] ❌ Webhook signature verification failed:`,
      err.message
    );
    console.error(
      `[Webhook:${correlationId}] Error type: ${err.constructor.name}`
    );
    console.error(`[Webhook:${correlationId}] Error code: ${err.code}`);
    console.error(
      `[Webhook:${correlationId}] Signature header length: ${signature?.length || 0}`
    );
    console.error(`[Webhook:${correlationId}] Body length: ${body.length}`);
    console.error(
      `[Webhook:${correlationId}] Buffer length: ${bodyBuffer.length}`
    );
    console.error(`[Webhook:${correlationId}] Full error:`, err);

    // Additional debugging for signature verification issues
    if (err.message.includes("No signatures found")) {
      console.error(
        `[Webhook:${correlationId}] Signature format issue - Raw signature: ${signature}`
      );
    }

    return NextResponse.json(
      {
        error: err.message,
        correlationId: correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  eventType = event.type;
  console.log(`[Webhook:${correlationId}] Processing event type: ${eventType}`);

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject = event.data.object;

        console.log(
          `[Webhook:${correlationId}] === CHECKOUT SESSION COMPLETED ===`
        );
        console.log(
          `[Webhook:${correlationId}] Session ID: ${stripeObject.id}`
        );
        console.log(
          `[Webhook:${correlationId}] Payment status: ${stripeObject.payment_status}`
        );
        console.log(
          `[Webhook:${correlationId}] Customer ID: ${stripeObject.customer}`
        );
        console.log(
          `[Webhook:${correlationId}] Client reference ID: ${stripeObject.client_reference_id}`
        );
        console.log(`[Webhook:${correlationId}] Mode: ${stripeObject.mode}`);
        console.log(
          `[Webhook:${correlationId}] Amount total: ${stripeObject.amount_total}`
        );
        console.log(
          `[Webhook:${correlationId}] Currency: ${stripeObject.currency}`
        );
        console.log(
          `[Webhook:${correlationId}] Metadata:`,
          stripeObject.metadata
        );

        // Event filtering: Only process events from our VibeList app
        const metadata = stripeObject.metadata || {};
        const isVibeListPayment = metadata.source === "vibelist-app";

        console.log(`[Webhook:${correlationId}] Event filtering check:`);
        console.log(`[Webhook:${correlationId}] - Source: ${metadata.source}`);
        console.log(
          `[Webhook:${correlationId}] - Is VibeList payment: ${isVibeListPayment}`
        );

        if (!isVibeListPayment) {
          console.log(
            `[Webhook:${correlationId}] ⏭️ Skipping event - not from VibeList app (source: ${metadata.source || "none"})`
          );
          break;
        }

        console.log(
          `[Webhook:${correlationId}] ✅ Event passed filtering - processing VibeList payment`
        );

        const session = await findCheckoutSession(stripeObject.id);
        console.log(`[Webhook:${correlationId}] Retrieved session details:`, {
          id: session?.id,
          customer: session?.customer,
          line_items_count: session?.line_items?.data?.length,
          first_line_item: session?.line_items?.data?.[0],
        });

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        console.log(`[Webhook:${correlationId}] Extracted data:`);
        console.log(`[Webhook:${correlationId}] - Customer ID: ${customerId}`);
        console.log(`[Webhook:${correlationId}] - Price ID: ${priceId}`);
        console.log(`[Webhook:${correlationId}] - User ID: ${userId}`);
        console.log(
          `[Webhook:${correlationId}] - Plan found: ${plan?.name || "NOT FOUND"}`
        );

        if (!customerId) {
          console.error(
            `[Webhook:${correlationId}] ❌ No customer ID found in session`
          );
          break;
        }

        if (!priceId) {
          console.error(
            `[Webhook:${correlationId}] ❌ No price ID found in session line items`
          );
          break;
        }

        const customer = await stripe.customers.retrieve(customerId);
        console.log(`[Webhook:${correlationId}] Customer details:`, {
          id: customer.id,
          email: customer.email,
          created: new Date(customer.created * 1000).toISOString(),
        });

        if (!plan) {
          console.error(
            `[Webhook:${correlationId}] ❌ No plan found for priceId: ${priceId}`
          );
          console.error(
            `[Webhook:${correlationId}] Available plans:`,
            configFile.stripe.plans.map((p) => ({
              name: p.name,
              priceId: p.priceId,
            }))
          );
          break;
        }

        let user;
        if (!userId) {
          console.log(
            `[Webhook:${correlationId}] No userId provided, looking up user by email: ${customer.email}`
          );

          // check if user already exists
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", customer.email)
            .single();

          console.log(`[Webhook:${correlationId}] Profile lookup result:`, {
            found: !!profile,
            error: profileError?.message,
            profileId: profile?.id,
          });

          if (profile) {
            user = profile;
            console.log(
              `[Webhook:${correlationId}] ✅ Found existing user profile: ${profile.id}`
            );
          } else {
            console.log(
              `[Webhook:${correlationId}] Creating new user for email: ${customer.email}`
            );

            // create a new user using supabase auth admin
            const { data: authData, error: authError } =
              await supabase.auth.admin.createUser({
                email: customer.email,
                email_confirm: true, // Auto-confirm email for webhook-created users
              });

            console.log(
              `[Webhook:${correlationId}] Auth user creation result:`,
              {
                success: !!authData?.user,
                error: authError?.message,
                userId: authData?.user?.id,
              }
            );

            if (authError) {
              console.error(
                `[Webhook:${correlationId}] ❌ Failed to create auth user:`,
                authError
              );
              break;
            }

            if (!authData?.user?.id) {
              console.error(
                `[Webhook:${correlationId}] ❌ Auth user creation returned no user ID`
              );
              break;
            }

            // Wait a moment for the trigger to create the profile
            console.log(
              `[Webhook:${correlationId}] Waiting for profile creation trigger...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Now look up the created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", authData.user.id)
              .single();

            console.log(
              `[Webhook:${correlationId}] New profile lookup result:`,
              {
                found: !!newProfile,
                error: newProfileError?.message,
                profileId: newProfile?.id,
              }
            );

            if (newProfile) {
              user = newProfile;
              console.log(
                `[Webhook:${correlationId}] ✅ Found newly created profile: ${newProfile.id}`
              );
            } else {
              // Fallback: manually create the profile if trigger didn't work
              console.log(
                `[Webhook:${correlationId}] Profile trigger didn't work, creating manually...`
              );

              const { data: manualProfile, error: manualProfileError } =
                await supabase
                  .from("profiles")
                  .insert({
                    id: authData.user.id,
                    email: customer.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .select()
                  .single();

              console.log(
                `[Webhook:${correlationId}] Manual profile creation result:`,
                {
                  success: !!manualProfile,
                  error: manualProfileError?.message,
                  profileId: manualProfile?.id,
                }
              );

              if (manualProfile) {
                user = manualProfile;
                console.log(
                  `[Webhook:${correlationId}] ✅ Manually created profile: ${manualProfile.id}`
                );
              } else {
                console.error(
                  `[Webhook:${correlationId}] ❌ Failed to create profile manually:`,
                  manualProfileError
                );
                break;
              }
            }
          }
        } else {
          console.log(
            `[Webhook:${correlationId}] Looking up user by ID: ${userId}`
          );

          // find user by ID
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          console.log(`[Webhook:${correlationId}] User lookup by ID result:`, {
            found: !!profile,
            error: profileError?.message,
            profileId: profile?.id,
          });

          if (profile) {
            user = profile;
            console.log(
              `[Webhook:${correlationId}] ✅ Found user profile: ${user?.id}`
            );
          } else {
            console.error(
              `[Webhook:${correlationId}] ❌ No profile found for user ID: ${userId}`
            );
            // Try to look up by email as fallback
            console.log(
              `[Webhook:${correlationId}] Attempting fallback lookup by email: ${customer.email}`
            );

            const { data: fallbackProfile, error: fallbackError } =
              await supabase
                .from("profiles")
                .select("*")
                .eq("email", customer.email)
                .single();

            if (fallbackProfile) {
              user = fallbackProfile;
              console.log(
                `[Webhook:${correlationId}] ✅ Found user via email fallback: ${fallbackProfile.id}`
              );
            } else {
              console.error(
                `[Webhook:${correlationId}] ❌ Fallback lookup also failed:`,
                fallbackError
              );
            }
          }
        }

        if (!user?.id) {
          console.error(
            `[Webhook:${correlationId}] ❌ Failed to find or create user for session: ${stripeObject.id}`
          );
          console.error(`[Webhook:${correlationId}] User lookup details:`, {
            userId,
            customerEmail: customer.email,
            userFound: !!user,
          });
          break;
        }

        // Determine access expiration based on plan
        let accessExpiresAt = null;
        // All plans now have lifetime access
        // accessExpiresAt remains null for lifetime access

        console.log(`[Webhook:${correlationId}] === UPDATING USER PROFILE ===`);
        console.log(`[Webhook:${correlationId}] User ID: ${user.id}`);
        console.log(`[Webhook:${correlationId}] Plan: ${plan.name}`);
        console.log(`[Webhook:${correlationId}] Access expires: LIFETIME`);
        console.log(`[Webhook:${correlationId}] Customer ID: ${customerId}`);
        console.log(`[Webhook:${correlationId}] Price ID: ${priceId}`);

        // Use a transaction-like approach to ensure atomic updates
        const updateData = {
          customer_id: customerId,
          price_id: priceId,
          has_access: true,
          access_expires_at: accessExpiresAt,
          updated_at: new Date().toISOString(), // Force updated timestamp
        };

        console.log(`[Webhook:${correlationId}] Update data:`, updateData);

        const { data: updateResult, error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user?.id)
          .select();

        if (updateError) {
          console.error(
            `[Webhook:${correlationId}] ❌ Failed to update user profile:`,
            updateError
          );
          console.error(`[Webhook:${correlationId}] Error details:`, {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
          });
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(
          `[Webhook:${correlationId}] ✅ Successfully updated user ${user.id} subscription status`
        );
        console.log(`[Webhook:${correlationId}] Update result:`, updateResult);

        // Verify the update was successful
        const { data: verifyProfile, error: verifyError } = await supabase
          .from("profiles")
          .select("has_access, access_expires_at, customer_id, price_id")
          .eq("id", user.id)
          .single();

        if (verifyError) {
          console.error(
            `[Webhook:${correlationId}] ❌ Failed to verify profile update:`,
            verifyError
          );
        } else {
          console.log(
            `[Webhook:${correlationId}] ✅ Verification - User ${user.id} current status:`,
            verifyProfile
          );
        }

        console.log(
          `[Webhook:${correlationId}] === CHECKOUT SESSION COMPLETED - SUCCESS ===`
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
        console.log(
          `[Webhook:${correlationId}] === CHECKOUT SESSION EXPIRED ===`
        );
        console.log(
          `[Webhook:${correlationId}] Session ID: ${event.data.object.id}`
        );
        console.log(
          `[Webhook:${correlationId}] Customer: ${event.data.object.customer}`
        );
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        console.log(`[Webhook:${correlationId}] === SUBSCRIPTION UPDATED ===`);
        console.log(
          `[Webhook:${correlationId}] Subscription ID: ${event.data.object.id}`
        );
        console.log(
          `[Webhook:${correlationId}] Customer: ${event.data.object.customer}`
        );
        console.log(
          `[Webhook:${correlationId}] Status: ${event.data.object.status}`
        );
        console.log(
          `[Webhook:${correlationId}] Cancel at period end: ${event.data.object.cancel_at_period_end}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject = event.data.object;

        console.log(`[Webhook:${correlationId}] === SUBSCRIPTION DELETED ===`);
        console.log(
          `[Webhook:${correlationId}] Subscription ID: ${stripeObject.id}`
        );
        console.log(
          `[Webhook:${correlationId}] Customer: ${stripeObject.customer}`
        );
        console.log(
          `[Webhook:${correlationId}] Status: ${stripeObject.status}`
        );

        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        console.log(
          `[Webhook:${correlationId}] Retrieved subscription details:`,
          {
            id: subscription.id,
            customer: subscription.customer,
            status: subscription.status,
          }
        );

        const { data: updateResult, error: updateError } = await supabase
          .from("profiles")
          .update({ has_access: false })
          .eq("customer_id", subscription.customer)
          .select();

        if (updateError) {
          console.error(
            `[Webhook:${correlationId}] ❌ Failed to revoke access:`,
            updateError
          );
        } else {
          console.log(
            `[Webhook:${correlationId}] ✅ Successfully revoked access:`,
            updateResult
          );
        }

        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        // Note: No metadata filtering needed here since we only process invoices for customers
        // that already exist in our profiles table (implicitly filtered to VibeList customers)
        const stripeObject = event.data.object;
        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer;

        console.log(`[Webhook:${correlationId}] === INVOICE PAID ===`);
        console.log(
          `[Webhook:${correlationId}] Invoice ID: ${stripeObject.id}`
        );
        console.log(`[Webhook:${correlationId}] Customer: ${customerId}`);
        console.log(`[Webhook:${correlationId}] Price ID: ${priceId}`);
        console.log(
          `[Webhook:${correlationId}] Amount paid: ${stripeObject.amount_paid}`
        );
        console.log(
          `[Webhook:${correlationId}] Currency: ${stripeObject.currency}`
        );

        // Find profile where customer_id equals the customerId (in table called 'profiles')
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error(
            `[Webhook:${correlationId}] ❌ Failed to find profile for customer ${customerId}:`,
            profileError
          );
          break;
        }

        console.log(
          `[Webhook:${correlationId}] ✅ Found profile for customer ${customerId}: ${profile.id}`
        );

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (profile.price_id !== priceId) {
          console.warn(
            `[Webhook:${correlationId}] ⚠️ Price mismatch - Profile: ${profile.price_id}, Invoice: ${priceId}`
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
            `[Webhook:${correlationId}] ❌ Failed to update profile for customer ${customerId}:`,
            updateError
          );
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(
          `[Webhook:${correlationId}] ✅ Successfully granted access to customer ${customerId}:`,
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
        console.log(
          `[Webhook:${correlationId}] === INVOICE PAYMENT FAILED ===`
        );
        console.log(
          `[Webhook:${correlationId}] Invoice ID: ${event.data.object.id}`
        );
        console.log(
          `[Webhook:${correlationId}] Customer: ${event.data.object.customer}`
        );
        console.log(
          `[Webhook:${correlationId}] Amount due: ${event.data.object.amount_due}`
        );
        break;

      default:
        console.log(`[Webhook:${correlationId}] === UNHANDLED EVENT TYPE ===`);
        console.log(`[Webhook:${correlationId}] Event type: ${eventType}`);
        console.log(
          `[Webhook:${correlationId}] Event data:`,
          event.data.object
        );
    }
  } catch (e) {
    console.error(
      `[Webhook:${correlationId}] ❌ Stripe processing error:`,
      e.message
    );
    console.error(`[Webhook:${correlationId}] Error stack:`, e.stack);
    console.error(`[Webhook:${correlationId}] Event type:`, eventType);
    console.error(`[Webhook:${correlationId}] Event ID:`, event?.id);
  }

  console.log(`[Webhook:${correlationId}] === WEBHOOK REQUEST END ===`);
  return NextResponse.json({});
}
