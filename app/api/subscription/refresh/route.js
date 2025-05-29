import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST() {
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

    // Force refresh by re-fetching the profile
    // This ensures we get the latest data from the database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_access, access_expires_at, customer_id, price_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile refresh error:", profileError);
      return NextResponse.json(
        { error: "Failed to refresh profile" },
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
      success: true,
      hasAccess: hasValidAccess,
      hasAccessField: profile.has_access,
      expiresAt: profile.access_expires_at,
      customerId: profile.customer_id,
      priceId: profile.price_id,
      isExpired: expiresAt && expiresAt <= now,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Subscription refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
