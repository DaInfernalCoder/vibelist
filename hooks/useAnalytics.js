"use client";

import { useState, useEffect, useCallback } from "react";
import { useWaitlist } from "@/contexts/WaitlistContext";
import { createClient } from "@/libs/supabase/client";

export const useAnalytics = () => {
  const { selectedWaitlist } = useWaitlist();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

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
    if (selectedWaitlist?.id) {
      fetchAnalytics(selectedWaitlist.id);
    } else {
      setAnalyticsData(null);
    }
  }, [selectedWaitlist?.id, fetchAnalytics]);

  // Set up real-time subscriptions for analytics data
  useEffect(() => {
    if (!selectedWaitlist?.id) return;

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
  }, [selectedWaitlist?.id, fetchAnalytics, supabase]);

  // Auto-refresh analytics data on page focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedWaitlist?.id) {
        fetchAnalytics(selectedWaitlist.id);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedWaitlist?.id, fetchAnalytics]);

  const refreshAnalytics = useCallback(() => {
    if (selectedWaitlist?.id) {
      fetchAnalytics(selectedWaitlist.id);
    }
  }, [selectedWaitlist?.id, fetchAnalytics]);

  return {
    analyticsData,
    isLoading,
    error,
    refreshAnalytics,
    hasData: !!analyticsData,
    waitlist: selectedWaitlist,
    isRefreshing,
  };
};
