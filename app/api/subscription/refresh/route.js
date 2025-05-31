import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Force dynamic rendering to prevent static generation errors
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = createClient();

    console.log("[Subscription Refresh] Starting refresh request");

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[Subscription Refresh] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Subscription Refresh] Refreshing for user: ${user.id}`);

    // Force refresh by re-fetching the profile with cache-busting
    // This ensures we get the latest data from the database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "has_access, access_expires_at, customer_id, price_id, updated_at"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "[Subscription Refresh] Profile refresh error:",
        profileError
      );
      return NextResponse.json(
        { error: "Failed to refresh profile" },
        { status: 500 }
      );
    }

    console.log(`[Subscription Refresh] Current profile data:`, profile);

    // Check if access is still valid
    const now = new Date();
    const expiresAt = profile.access_expires_at
      ? new Date(profile.access_expires_at)
      : null;
    const hasValidAccess =
      profile.has_access && (!expiresAt || expiresAt > now);

    console.log(
      `[Subscription Refresh] Access check result: ${hasValidAccess} (has_access: ${profile.has_access}, expires: ${profile.access_expires_at})`
    );

    const response = {
      success: true,
      hasAccess: hasValidAccess,
      hasAccessField: profile.has_access,
      expiresAt: profile.access_expires_at,
      customerId: profile.customer_id,
      priceId: profile.price_id,
      isExpired: expiresAt && expiresAt <= now,
      refreshedAt: new Date().toISOString(),
      updatedAt: profile.updated_at,
    };

    console.log(`[Subscription Refresh] Returning response:`, response);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Subscription refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
