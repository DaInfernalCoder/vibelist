import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// For testing purposes - should be replaced with proper RLS in production
const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

/**
 * API endpoint for handling waitlist signups
 * Accepts: email (required), name, waitlistId (required), custom fields, and referral source
 */
export async function POST(req) {
  const body = await req.json();

  // Validate required fields
  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!body.waitlistId) {
    return NextResponse.json(
      { error: "Waitlist ID is required" },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  try {
    // Use admin client in development mode for testing
    // In production, we should fix the RLS policies instead
    const supabase =
      process.env.NODE_ENV === "development" && adminSupabase
        ? adminSupabase
        : createClient();

    // Check if waitlist exists and is published
    const { data: waitlist, error: waitlistError } = await supabase
      .from("waitlists")
      .select("id, published")
      .eq("id", body.waitlistId)
      .single();

    if (waitlistError || !waitlist) {
      console.error(
        "Waitlist not found:",
        waitlistError?.message || "Unknown error"
      );
      return NextResponse.json(
        { error: "Waitlist not found", details: waitlistError?.message },
        { status: 404 }
      );
    }

    if (!waitlist.published) {
      return NextResponse.json(
        { error: "This waitlist is not currently accepting signups" },
        { status: 403 }
      );
    }

    // Check for duplicate signups
    const { data: existingSignup, error: checkError } = await supabase
      .from("waitlist_signups")
      .select("id")
      .eq("waitlist_id", body.waitlistId)
      .eq("email", body.email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing signup:", checkError.message);
      return NextResponse.json(
        {
          error: "Failed to process signup",
          details: `Error checking for existing signup: ${checkError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingSignup) {
      return NextResponse.json(
        { error: "This email is already registered for this waitlist" },
        { status: 409 } // 409 Conflict
      );
    }

    // Create the signup record
    const signupData = {
      waitlist_id: body.waitlistId,
      email: body.email,
      name: body.name || null,
      referral_source: body.source || null,
    };

    console.log(
      "Attempting to create signup with data:",
      JSON.stringify(signupData)
    );

    const { data: signup, error: insertError } = await supabase
      .from("waitlist_signups")
      .insert([signupData])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating signup:", insertError.message);
      return NextResponse.json(
        {
          error: "Failed to join waitlist",
          details: `Insert error: ${insertError.message}`,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    // Successfully created signup
    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist",
      id: signup.id,
    });
  } catch (e) {
    console.error("Unexpected error in waitlist signup:", e.message, e.stack);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
      },
      { status: 500 }
    );
  }
}
