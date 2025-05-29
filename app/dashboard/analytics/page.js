"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWaitlist } from "@/contexts/WaitlistContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { createClient } from "@/libs/supabase/client";
import PaywallAlert from "@/components/PaywallAlert";

// Import our analytics components
import WaitlistStatusCard from "./components/WaitlistStatusCard";
import MetricCard from "./components/MetricCard";
import SignupsChart from "./components/SignupsChart";
import ReferralSourcesChart from "./components/ReferralSourcesChart";
import RecentSignupsTable from "./components/RecentSignupsTable";
import WaitlistLinkCard from "./components/WaitlistLinkCard";

export default function AnalyticsPage() {
  const { selectedWaitlist, waitlists, selectWaitlist, user } = useWaitlist();
  const { hasValidAccess, isLoading: isCheckingSubscription } =
    useSubscription();
  const searchParams = useSearchParams();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (waitlistId, isRefresh = false) => {
    if (!waitlistId) {
      setAnalyticsData(null);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/waitlists/${waitlistId}/analytics`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch analytics when selected waitlist changes
  useEffect(() => {
    if (selectedWaitlist?.id && hasValidAccess) {
      fetchAnalytics(selectedWaitlist.id);
    } else {
      setAnalyticsData(null);
    }
  }, [selectedWaitlist?.id, hasValidAccess, fetchAnalytics]);

  // Set up real-time subscriptions for analytics data
  useEffect(() => {
    if (!selectedWaitlist?.id || !hasValidAccess) return;

    const waitlistId = selectedWaitlist.id;

    // Create a channel for real-time updates
    const channel = supabase
      .channel(`analytics_${waitlistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waitlist_signups",
          filter: `waitlist_id=eq.${waitlistId}`,
        },
        () => {
          // Refresh analytics when signups change
          fetchAnalytics(waitlistId, true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waitlist_analytics",
          filter: `waitlist_id=eq.${waitlistId}`,
        },
        () => {
          // Refresh analytics when analytics data changes
          fetchAnalytics(waitlistId, true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waitlists",
          filter: `id=eq.${waitlistId}`,
        },
        () => {
          // Refresh analytics when waitlist details change
          fetchAnalytics(waitlistId, true);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedWaitlist?.id, hasValidAccess, fetchAnalytics, supabase]);

  // Auto-refresh analytics data on page focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedWaitlist?.id && hasValidAccess) {
        fetchAnalytics(selectedWaitlist.id);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedWaitlist?.id, hasValidAccess, fetchAnalytics]);

  // Handle direct navigation with waitlist ID
  useEffect(() => {
    const waitlistId = searchParams.get("waitlist");
    if (
      waitlistId &&
      waitlists.length > 0 &&
      (!selectedWaitlist || selectedWaitlist.id !== waitlistId)
    ) {
      const targetWaitlist = waitlists.find((w) => w.id === waitlistId);
      if (targetWaitlist) {
        selectWaitlist(targetWaitlist);
      }
    }
  }, [searchParams, waitlists, selectedWaitlist, selectWaitlist]);

  // Empty state component
  const EmptyState = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your waitlist performance
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Waitlist Selected</h3>
          <p className="text-muted-foreground">
            Select a waitlist from the sidebar to view its analytics
          </p>
        </div>
      </div>
    </div>
  );

  // Show loading state while checking subscription
  if (isCheckingSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze your waitlist performance
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show paywall alert if user doesn't have valid subscription
  if (!hasValidAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze your waitlist performance
            </p>
          </div>
        </div>

        <PaywallAlert
          feature="Analytics & Insights"
          description="Get detailed analytics about your waitlist performance, including signup trends, referral sources, and conversion metrics."
          className="max-w-4xl"
        />
      </div>
    );
  }

  // Show empty state if no waitlist is selected
  if (!selectedWaitlist) {
    return <EmptyState />;
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Analytics</h1>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-2">
              Track and analyze your waitlist performance
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Data will automatically refresh when you return to this page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Analytics</h1>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            Track and analyze your waitlist performance
          </p>
        </div>
      </div>

      {/* Waitlist Status Card */}
      <WaitlistStatusCard
        waitlist={analyticsData?.waitlist}
        isLoading={isLoading}
      />

      {/* Waitlist Link Card - Full Width */}
      <WaitlistLinkCard
        waitlist={analyticsData?.waitlist}
        isLoading={isLoading}
      />

      {/* Total Signups Card - Full Width */}
      <MetricCard
        title="Total Signups"
        value={analyticsData?.metrics?.totalSignups?.toLocaleString() || "0"}
        isLoading={isLoading}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SignupsChart
          data={analyticsData?.charts?.dailySignups}
          isLoading={isLoading}
        />
        <ReferralSourcesChart
          data={analyticsData?.charts?.referralSources}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Signups Table */}
      <RecentSignupsTable
        data={analyticsData?.recentSignups}
        isLoading={isLoading}
      />
    </div>
  );
}
