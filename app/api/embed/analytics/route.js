import { NextResponse } from "next/server";
import { getEmbedAnalytics } from "@/lib/embed-analytics";

// CORS headers for analytics requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
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

export async function GET(request) {
  try {
    // Get all embed analytics data
    const analyticsData = getEmbedAnalytics();

    // Calculate summary statistics
    const summary = {
      totalWaitlists: Object.keys(analyticsData).length,
      totalLoads: Object.values(analyticsData).reduce(
        (sum, data) => sum + data.totalLoads,
        0
      ),
      totalUniqueIPs: new Set(
        Object.values(analyticsData).flatMap((data) =>
          Object.keys(data.dailyLoads || {})
        )
      ).size,
      mostActiveWaitlist: Object.values(analyticsData).reduce(
        (max, current) =>
          current.totalLoads > (max?.totalLoads || 0) ? current : max,
        null
      ),
    };

    return createCORSResponse({
      summary,
      waitlists: analyticsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching embed analytics:", error);
    return createCORSResponse(
      { error: "Failed to fetch embed analytics", details: error.message },
      { status: 500 }
    );
  }
}
