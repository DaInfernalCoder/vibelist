"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PaywallAlert from "@/components/PaywallAlert";

/**
 * RouteGuard component for protecting premium routes
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if access is granted
 * @param {string} props.feature - The feature name for the paywall
 * @param {string} props.description - Description for the paywall
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {boolean} props.requireSubscription - Whether subscription is required (default: true)
 * @param {string} props.redirectTo - Where to redirect if not authenticated (default: "/signin")
 * @param {string} props.fallbackComponent - Custom fallback component instead of paywall
 */
const RouteGuard = ({
  children,
  feature = "Premium Feature",
  description = "This feature requires a premium subscription to access.",
  requireAuth = true,
  requireSubscription = true,
  redirectTo = "/signin",
  fallbackComponent = null,
}) => {
  const {
    isAuthenticated,
    hasValidAccess,
    isLoading: isCheckingSubscription,
  } = useSubscription();
  const router = useRouter();

  // Handle authentication redirect
  useEffect(() => {
    if (requireAuth && !isCheckingSubscription && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?returnTo=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [
    requireAuth,
    isAuthenticated,
    isCheckingSubscription,
    redirectTo,
    router,
  ]);

  // Show loading state while checking subscription
  if (isCheckingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render anything
  // (the useEffect above will handle the redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If subscription is required but user doesn't have access
  if (requireSubscription && !hasValidAccess) {
    // Use custom fallback component if provided
    if (fallbackComponent) {
      return fallbackComponent;
    }

    // Default paywall
    return (
      <PaywallAlert
        feature={feature}
        description={description}
        className="max-w-4xl mx-auto"
      />
    );
  }

  // User has required access, render children
  return children;
};

export default RouteGuard;
