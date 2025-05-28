"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useWaitlist } from "@/contexts/WaitlistContext";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Import our analytics components
import MetricCard from "./components/MetricCard";
import SignupsChart from "./components/SignupsChart";
import ReferralSourcesChart from "./components/ReferralSourcesChart";
import RecentSignupsTable from "./components/RecentSignupsTable";
import WaitlistStatusCard from "./components/WaitlistStatusCard";
import WaitlistLinkCard from "./components/WaitlistLinkCard";
import EmptyState from "./components/EmptyState";

export default function AnalyticsPage() {
  const { selectedWaitlist, waitlists, selectWaitlist } = useWaitlist();
  const { analyticsData, isLoading, isRefreshing, error, hasData } =
    useAnalytics();
  const searchParams = useSearchParams();

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
