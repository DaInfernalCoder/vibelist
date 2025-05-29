import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get the line item details
    const lineItem = session.line_items?.data[0];
    const priceId = lineItem?.price?.id;
    const amount = lineItem?.amount_total
      ? (lineItem.amount_total / 100).toFixed(2)
      : "0.00";

    // Find the plan details from config
    const plan = config.stripe.plans.find((p) => p.priceId === priceId);
    const planName = plan?.name || "Unknown Plan";

    // Get user profile to check access expiration
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let expiresAt = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("access_expires_at")
        .eq("id", user.id)
        .single();

      expiresAt = profile?.access_expires_at;
    }

    // Return payment details
    return NextResponse.json({
      success: true,
      planName,
      amount,
      transactionId: session.payment_intent?.id || session.id,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      expiresAt,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
