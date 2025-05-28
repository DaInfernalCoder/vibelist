import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user owns this waitlist
    const { data: waitlist, error: waitlistError } = await supabase
      .from("waitlists")
      .select("id, name, status, published, url_slug, created_at")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (waitlistError || !waitlist) {
      return NextResponse.json(
        { error: "Waitlist not found" },
        { status: 404 }
      );
    }

    // Get analytics data
    const { data: analytics } = await supabase
      .from("waitlist_analytics")
      .select("*")
      .eq("waitlist_id", id)
      .single();

    // Get signup data for detailed analysis
    const { data: signups, error: signupsError } = await supabase
      .from("waitlist_signups")
      .select("*")
      .eq("waitlist_id", id)
      .order("signup_time", { ascending: false });

    if (signupsError) {
      console.error("Error fetching signups:", signupsError);
    }

    // Calculate metrics
    const totalSignups = signups?.length || 0;
    const pendingSignups =
      signups?.filter((s) => s.status === "pending").length || 0;
    const approvedSignups =
      signups?.filter((s) => s.status === "approved").length || 0;

    // Calculate daily signups for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySignups = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const daySignups =
        signups?.filter((signup) => {
          const signupDate = new Date(signup.signup_time)
            .toISOString()
            .split("T")[0];
          return signupDate === dateStr;
        }).length || 0;

      dailySignups.push({
        date: dateStr,
        signups: daySignups,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    // Calculate referral sources
    const referralSources = {};
    signups?.forEach((signup) => {
      const source = signup.referral_source || signup.utm_source || "Direct";
      referralSources[source] = (referralSources[source] || 0) + 1;
    });

    const referralData = Object.entries(referralSources).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // Calculate conversion rate (assuming some visits data - this would need to be tracked separately)
    const estimatedVisits = totalSignups * 3; // Rough estimate
    const conversionRate =
      totalSignups > 0
        ? ((totalSignups / estimatedVisits) * 100).toFixed(1)
        : 0;

    // Calculate average time on waitlist for approved signups
    const approvedSignupsWithTime =
      signups?.filter((s) => s.status === "approved") || [];
    let avgTimeOnWaitlist = 0;
    if (approvedSignupsWithTime.length > 0) {
      const totalDays = approvedSignupsWithTime.reduce((sum, signup) => {
        const signupDate = new Date(signup.signup_time);
        const now = new Date();
        const daysDiff = Math.floor((now - signupDate) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);
      avgTimeOnWaitlist = Math.round(
        totalDays / approvedSignupsWithTime.length
      );
    }

    // Recent signups (last 10)
    const recentSignups = signups?.slice(0, 10) || [];

    const analyticsData = {
      waitlist: {
        id: waitlist.id,
        name: waitlist.name,
        status: waitlist.status,
        published: waitlist.published,
        url_slug: waitlist.url_slug,
        created_at: waitlist.created_at,
      },
      metrics: {
        totalSignups,
        pendingSignups,
        approvedSignups,
        conversionRate: `${conversionRate}%`,
        avgTimeOnWaitlist: `${avgTimeOnWaitlist} days`,
        waitlistSize: pendingSignups,
      },
      charts: {
        dailySignups,
        referralSources: referralData,
      },
      recentSignups: recentSignups.map((signup) => ({
        id: signup.id,
        email: signup.email,
        name: signup.name,
        signup_time: signup.signup_time,
        status: signup.status,
        referral_source:
          signup.referral_source || signup.utm_source || "Direct",
      })),
      rawAnalytics: analytics,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
