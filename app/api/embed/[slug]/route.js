import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { trackEmbedAnalytics } from "@/lib/embed-analytics";

// Create public client for unauthenticated operations (cross-device compatible)
const publicSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CORS headers for embed requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

// Simple in-memory rate limiting for embed API (for production, use Redis)
const rateLimitMap = new Map();
const EMBED_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const EMBED_RATE_LIMIT_MAX_REQUESTS = 10; // 10 embed requests per IP per minute

/**
 * Rate limiting based on IP address for embed requests
 */
function checkEmbedRateLimit(ip) {
  const now = Date.now();
  const key = `embed_rate_limit_ip_${ip}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + EMBED_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  const limit = rateLimitMap.get(key);

  // Reset if window has passed
  if (now > limit.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + EMBED_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= EMBED_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment count
  limit.count++;
  return true;
}

/**
 * Get client IP address from request
 */
function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("x-vercel-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (remoteAddr) {
    return remoteAddr.split(",")[0].trim();
  }

  return "unknown";
}

// Generate a unique request ID for API tracing
const generateRequestId = () => {
  return `embed_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Helper function to create CORS-enabled responses
function createCORSResponse(data, options = {}) {
  const { status = 200, headers = {} } = options;
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
    },
  });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request, { params }) {
  const requestId = generateRequestId();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  console.log(
    `[${requestId}] Embed API: GET /api/embed/${params.slug} from IP: ${clientIP}`
  );

  const { slug } = params;

  if (!slug) {
    console.warn(`[${requestId}] Missing slug parameter`);
    return createCORSResponse(
      { error: "Waitlist slug is required" },
      { status: 400 }
    );
  }

  // Check rate limit
  if (!checkEmbedRateLimit(clientIP)) {
    console.warn(`[${requestId}] Rate limit exceeded for IP: ${clientIP}`);
    return createCORSResponse(
      {
        error: "Too many embed requests. Please try again later.",
        code: "EMBED_RATE_LIMITED",
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
    console.log(`[${requestId}] Fetching waitlist data for embed: ${slug}`);

    // Fetch waitlist data optimized for embedding
    const { data: waitlistData, error } = await publicSupabase
      .from("waitlists")
      .select(
        `
        id,
        name,
        description,
        url_slug,
        customization_settings (
          theme_color,
          logo_url,
          show_social_proof
        )
      `
      )
      .eq("url_slug", slug)
      .eq("published", true)
      .eq("status", "published")
      .single();

    if (error) {
      console.error(`[${requestId}] Database error:`, error.message);
      if (error.code === "PGRST116") {
        return createCORSResponse(
          { error: "Waitlist not found or is not published" },
          { status: 404 }
        );
      }
      return createCORSResponse(
        { error: "Failed to fetch waitlist data" },
        { status: 500 }
      );
    }

    if (!waitlistData) {
      console.warn(`[${requestId}] No waitlist found for slug: ${slug}`);
      return createCORSResponse(
        { error: "Waitlist not found or is not published" },
        { status: 404 }
      );
    }

    // Get signup count
    const { count: signupCount, error: countError } = await publicSupabase
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true })
      .eq("waitlist_id", waitlistData.id);

    if (countError) {
      console.warn(
        `[${requestId}] Error fetching signup count:`,
        countError.message
      );
    }

    console.log(`[${requestId}] Waitlist found for embed:`, {
      id: waitlistData.id,
      name: waitlistData.name,
      signupCount: signupCount || 0,
      hasCustomizationSettings: !!waitlistData.customization_settings,
    });

    const customizationSettings = waitlistData.customization_settings || {};

    // Prepare embed-optimized data
    const embedData = {
      id: waitlistData.id,
      name: waitlistData.name,
      description: waitlistData.description,
      slug: waitlistData.url_slug,
      signupCount: signupCount || 0,
      themeColor: customizationSettings.theme_color || "#4F46E5",
      logoUrl: customizationSettings.logo_url,
      showSocialProof: customizationSettings.show_social_proof !== false,
      waitlistUrl: `${process.env.NEXT_PUBLIC_URL || "https://vibelist.co"}/waitlist/${slug}`,
    };

    console.log(`[${requestId}] Returning embed data:`, {
      name: embedData.name,
      signupCount: embedData.signupCount,
      themeColor: embedData.themeColor,
    });

    // Track analytics for successful embed loads
    const analytics = trackEmbedAnalytics(
      waitlistData.id,
      slug,
      clientIP,
      userAgent
    );
    console.log(`[${requestId}] Analytics tracked:`, {
      totalLoads: analytics.totalLoads,
      uniqueIPs: analytics.uniqueIPs.size,
      todayLoads:
        analytics.dailyLoads.get(new Date().toISOString().split("T")[0]) || 0,
    });

    // Add analytics data to response for debugging (can be removed in production)
    const responseData = {
      ...embedData,
      _analytics: {
        totalLoads: analytics.totalLoads,
        uniqueIPs: analytics.uniqueIPs.size,
        requestId: requestId,
      },
    };

    return createCORSResponse(responseData);
  } catch (err) {
    console.error(
      `[${requestId}] Unexpected error in /api/embed/[slug]:`,
      err.message,
      err.stack
    );
    return createCORSResponse(
      { error: "An unexpected error occurred", details: err.message },
      { status: 500 }
    );
  }
}
