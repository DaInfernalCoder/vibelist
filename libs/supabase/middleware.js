// libs/supabase/middleware.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Define routes that require subscription access
const PREMIUM_ROUTES = ["/dashboard/analytics", "/dashboard/market"];

// Define routes that require authentication but not subscription
const AUTH_REQUIRED_ROUTES = ["/dashboard"];

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if this is a premium route
  const isPremiumRoute = PREMIUM_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if this is an auth-required route
  const isAuthRoute =
    AUTH_REQUIRED_ROUTES.some((route) => pathname.startsWith(route)) ||
    isPremiumRoute;

  // Redirect unauthenticated users from protected routes to signin
  if (!user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    // Add return URL for better UX
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  // For premium routes, check subscription status
  if (user && isPremiumRoute) {
    try {
      // Get user's subscription status from the database
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("has_access, access_expires_at")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking subscription in middleware:", error);
        // On error, allow access but log the issue
        // The client-side SubscriptionContext will handle the actual paywall
        return supabaseResponse;
      }

      // Check if user has valid subscription
      const hasValidSubscription =
        profile?.has_access &&
        (!profile.access_expires_at ||
          new Date(profile.access_expires_at) > new Date());

      if (!hasValidSubscription) {
        // User doesn't have valid subscription, redirect to pricing
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        url.searchParams.set("feature", "premium");
        url.searchParams.set("returnTo", pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Subscription check error in middleware:", error);
      // On error, allow access but log the issue
      // The client-side SubscriptionContext will handle the actual paywall
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
