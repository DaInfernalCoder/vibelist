import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering to prevent static generation errors
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Create admin client for development/testing
const adminSupabase =
  process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

// Create public client for unauthenticated operations
const publicSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 signup attempts per email per minute (allows for retries)

/**
 * Rate limiting based on email address to prevent spam while allowing multiple users per IP
 */
function checkRateLimit(email) {
  const now = Date.now();
  const key = `rate_limit_email_${email.toLowerCase()}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimitMap.get(key);

  // Reset if window has passed
  if (now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment count
  limit.count++;
  return true;
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  return response;
}

/**
 * Create a JSON response with CORS headers
 */
function createCORSResponse(data, options = {}) {
  const response = NextResponse.json(data, options);
  return addCORSHeaders(response);
}

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
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return createCORSResponse(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Validate request size (prevent large payloads)
  const requestSize = JSON.stringify(body).length;
  if (requestSize > 1024) {
    // 1KB limit
    return createCORSResponse(
      { error: "Request payload too large" },
      { status: 413 }
    );
  }

  // Validate required fields
  if (!body.email) {
    return createCORSResponse({ error: "Email is required" }, { status: 400 });
  }

  if (!body.waitlistId) {
    return createCORSResponse(
      { error: "Waitlist ID is required" },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return createCORSResponse(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // Check rate limit per email (after email validation)
  if (!checkRateLimit(body.email)) {
    console.warn(`Rate limit exceeded for email: ${body.email}`);
    return createCORSResponse(
      {
        error: "Too many signup attempts. Please try again later.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      }
    );
  }

  try {
    // Use public client for all waitlist operations to ensure cross-device compatibility
    // This allows unauthenticated users to sign up for published waitlists
    // Admin client is only used in development for testing/debugging
    const supabase =
      process.env.NODE_ENV === "development" && adminSupabase
        ? adminSupabase
        : publicSupabase;

    // Check if waitlist exists and is published using public client
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
      return createCORSResponse(
        { error: "Waitlist not found", details: waitlistError?.message },
        { status: 404 }
      );
    }

    if (!waitlist.published) {
      return createCORSResponse(
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
      return createCORSResponse(
        {
          error: "Failed to process signup",
          details: `Error checking for existing signup: ${checkError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingSignup) {
      return createCORSResponse(
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
              return createCORSResponse(
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
            return createCORSResponse({
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
        return createCORSResponse(
          {
            error: errorInfo.userMessage,
            details: `Insert error: ${insertError.message}`,
            code: insertError.code,
          },
          { status: 500 }
        );
      }

      // Successfully created signup
      return createCORSResponse({
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
    return createCORSResponse(
      {
        error: e.message || "An unexpected error occurred",
        details: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Max-Age": "86400",
    },
  });
}
