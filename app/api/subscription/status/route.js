import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Force dynamic rendering to prevent static generation errors
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with subscription details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_access, access_expires_at, customer_id, price_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // Check if access is still valid
    const now = new Date();
    const expiresAt = profile.access_expires_at
      ? new Date(profile.access_expires_at)
      : null;
    const hasValidAccess =
      profile.has_access && (!expiresAt || expiresAt > now);

    return NextResponse.json({
      hasAccess: hasValidAccess,
      hasAccessField: profile.has_access,
      expiresAt: profile.access_expires_at,
      customerId: profile.customer_id,
      priceId: profile.price_id,
      isExpired: expiresAt && expiresAt <= now,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
