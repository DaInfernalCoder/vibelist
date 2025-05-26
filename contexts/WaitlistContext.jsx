"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";

const WaitlistContext = createContext();

export const useWaitlist = () => {
  const context = useContext(WaitlistContext);
  if (!context) {
    throw new Error("useWaitlist must be used within a WaitlistProvider");
  }
  return context;
};

export const WaitlistProvider = ({ children }) => {
  const [waitlists, setWaitlists] = useState([]);
  const [selectedWaitlist, setSelectedWaitlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const supabase = createClient();

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Note: session.user is used here only for client-side state management
      // For server-side operations, we always use supabase.auth.getUser()
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch waitlists when user is available
  useEffect(() => {
    if (user) {
      fetchWaitlists();
      setupRealtimeSubscription();
    } else {
      setWaitlists([]);
      setSelectedWaitlist(null);
      setIsLoading(false);
    }
  }, [user]);

  // Fetch waitlists from Supabase
  const fetchWaitlists = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("waitlists")
        .select(
          `
          id,
          name,
          description,
          status,
          published,
          url_slug,
          created_at,
          updated_at,
          waitlist_analytics (
            total_signups
          )
        `
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setWaitlists(data || []);

      // Set the first waitlist as selected if none is selected
      if (data && data.length > 0 && !selectedWaitlist) {
        setSelectedWaitlist(data[0]);
      } else if (data && data.length === 0) {
        setSelectedWaitlist(null);
      }
    } catch (err) {
      console.error("Error fetching waitlists:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscription for waitlist changes
  const setupRealtimeSubscription = () => {
    if (!user) return;

    const subscription = supabase
      .channel("waitlists_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waitlists",
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          // Refetch waitlists when changes occur
          fetchWaitlists();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waitlist_analytics",
        },
        () => {
          // Refetch waitlists when analytics change
          fetchWaitlists();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Select a specific waitlist
  const selectWaitlist = (waitlist) => {
    setSelectedWaitlist(waitlist);
  };

  // Refresh waitlists data
  const refreshWaitlists = () => {
    if (user) {
      fetchWaitlists();
    }
  };

  // Get signup count for a waitlist
  const getSignupCount = (waitlistId) => {
    const waitlist = waitlists.find((w) => w.id === waitlistId);
    return waitlist?.waitlist_analytics?.[0]?.total_signups || 0;
  };

  // Check if waitlist is published
  const isWaitlistPublished = (waitlist) => {
    return waitlist?.published === true && waitlist?.status === "published";
  };

  const value = {
    waitlists,
    selectedWaitlist,
    isLoading,
    error,
    user,
    selectWaitlist,
    refreshWaitlists,
    getSignupCount,
    isWaitlistPublished,
  };

  return (
    <WaitlistContext.Provider value={value}>
      {children}
    </WaitlistContext.Provider>
  );
};

export default WaitlistProvider;
