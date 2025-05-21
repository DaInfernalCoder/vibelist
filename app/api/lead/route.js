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
 * Categorize database errors to provide better error handling and messages
 */
function categorizeDbError(error) {
  // Keep track of the original error
  const result = {
    originalError: error,
    type: "UNKNOWN",
    userMessage: "An unexpected error occurred",
    severity: "medium",
    needsFallback: false,
  };

  if (!error) return result;

  // Check for GROUP BY errors
  if (
    error.message &&
    error.message.includes("must appear in the GROUP BY clause")
  ) {
    return {
      ...result,
      type: "SQL_GROUP_BY_ERROR",
      severity: "high",
      userMessage: "An error occurred in analytics processing",
      details: "SQL GROUP BY clause error in analytics function",
      needsFallback: true,
      suggestion:
        "Consider disabling analytics triggers during high-load operations",
    };
  }

  // Check for constraint violations
  if (error.code === "23505") {
    return {
      ...result,
      type: "UNIQUE_VIOLATION",
      severity: "low",
      userMessage: "This record already exists",
      details: "Unique constraint violation",
    };
  }

  // Check for foreign key violations
  if (error.code === "23503") {
    return {
      ...result,
      type: "FOREIGN_KEY_VIOLATION",
      severity: "medium",
      userMessage: "Referenced record does not exist",
      details: "Foreign key constraint violation",
    };
  }

  // Default database error
  if (
    (error.code && error.code.startsWith("22")) ||
    error.code.startsWith("23")
  ) {
    return {
      ...result,
      type: "DATABASE_ERROR",
      userMessage: "A database error occurred",
      details: error.message,
    };
  }

  return result;
}

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

    // Extract custom fields if provided
    const customFieldsData = body.customFields || {};

    // Create the signup record
    const signupData = {
      waitlist_id: body.waitlistId,
      email: body.email,
      name: body.name || null,
      referral_source: body.source || null,
      custom_data:
        Object.keys(customFieldsData).length > 0
          ? JSON.stringify(customFieldsData)
          : null,
      // Include UTM parameters if available
      utm_source: body.source || customFieldsData.utm_source || null,
      utm_medium: customFieldsData.utm_medium || null,
      utm_campaign: customFieldsData.utm_campaign || null,
      utm_content: customFieldsData.utm_content || null,
      utm_term: customFieldsData.utm_term || null,
    };

    console.log(
      "Attempting to create signup with data:",
      JSON.stringify(signupData)
    );

    // First attempt - standard insertion
    try {
      const { data: signup, error: insertError } = await supabase
        .from("waitlist_signups")
        .insert([signupData])
        .select()
        .single();

      if (insertError) {
        // Analyze the error
        const errorInfo = categorizeDbError(insertError);
        console.error("Error creating signup:", {
          message: insertError.message,
          type: errorInfo.type,
          code: insertError.code,
          details: errorInfo.details || "",
          data: JSON.stringify(signupData),
        });

        // Check if we need to try a fallback approach for GROUP BY errors
        if (
          errorInfo.needsFallback &&
          errorInfo.type === "SQL_GROUP_BY_ERROR"
        ) {
          console.log("Attempting to disable analytics triggers for signup");

          // Try to temporarily disable analytics triggers
          try {
            // Disable analytics triggers
            await supabase.rpc("toggle_analytics_triggers", {
              p_enable: false,
            });

            // Retry the insert with triggers disabled
            const { data: fallbackSignup, error: fallbackError } =
              await supabase
                .from("waitlist_signups")
                .insert([signupData])
                .select()
                .single();

            if (fallbackError) {
              console.error(
                "Fallback signup attempt also failed:",
                fallbackError.message
              );
              return NextResponse.json(
                {
                  error: "Failed to join waitlist",
                  details: `Insert error: ${fallbackError.message}`,
                  code: fallbackError.code,
                },
                { status: 500 }
              );
            }

            // Re-enable analytics triggers
            await supabase.rpc("toggle_analytics_triggers", { p_enable: true });

            // Successfully created signup with fallback
            return NextResponse.json({
              success: true,
              message: "Successfully joined the waitlist",
              id: fallbackSignup.id,
            });
          } catch (triggerError) {
            console.error(
              "Error handling trigger fallback:",
              triggerError.message
            );
          }
        }

        // Return original error if no fallback or fallback failed
        return NextResponse.json(
          {
            error: errorInfo.userMessage,
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
    } catch (insertError) {
      console.error("Exception during signup insertion:", insertError.message);
      throw insertError; // Propagate to the outer catch
    }
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
