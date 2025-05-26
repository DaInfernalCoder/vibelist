"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Action types
const ACTIONS = {
  FETCH_INIT: "FETCH_INIT",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_ERROR: "FETCH_ERROR",
  SET_SEARCH: "SET_SEARCH",
  SET_USER: "SET_USER",
  SELECT_WAITLIST: "SELECT_WAITLIST",
  ADD_WAITLIST: "ADD_WAITLIST",
  UPDATE_WAITLIST: "UPDATE_WAITLIST",
  DELETE_WAITLIST: "DELETE_WAITLIST",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Error types for categorization
const ERROR_TYPES = {
  NETWORK_ERROR: "Failed to connect to database",
  AUTH_ERROR: "Authentication required",
  PERMISSION_ERROR: "Insufficient permissions",
  RATE_LIMIT: "Too many requests",
  UNKNOWN_ERROR: "An unexpected error occurred",
};

// Initial state
const initialState = {
  waitlists: [],
  selectedWaitlist: null,
  user: null,
  isLoading: true,
  error: null,
  errorType: null,
  searchTerm: "",
  retryCount: 0,
};

// Reducer function for state management
const waitlistReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.FETCH_INIT:
      return {
        ...state,
        isLoading: true,
        error: null,
        errorType: null,
      };
    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        waitlists: action.payload,
        error: null,
        errorType: null,
        retryCount: 0,
        selectedWaitlist:
          state.selectedWaitlist ||
          (action.payload.length > 0 ? action.payload[0] : null),
      };
    case ACTIONS.FETCH_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.message,
        errorType: action.payload.type,
        retryCount: state.retryCount + 1,
      };
    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    case ACTIONS.SET_SEARCH:
      return {
        ...state,
        searchTerm: action.payload,
      };
    case ACTIONS.SELECT_WAITLIST:
      return {
        ...state,
        selectedWaitlist: action.payload,
      };
    case ACTIONS.ADD_WAITLIST:
      return {
        ...state,
        waitlists: [action.payload, ...state.waitlists],
        selectedWaitlist: action.payload,
      };
    case ACTIONS.UPDATE_WAITLIST:
      return {
        ...state,
        waitlists: state.waitlists.map((waitlist) =>
          waitlist.id === action.payload.id
            ? { ...waitlist, ...action.payload }
            : waitlist
        ),
        selectedWaitlist:
          state.selectedWaitlist?.id === action.payload.id
            ? { ...state.selectedWaitlist, ...action.payload }
            : state.selectedWaitlist,
      };
    case ACTIONS.DELETE_WAITLIST:
      return {
        ...state,
        waitlists: state.waitlists.filter(
          (waitlist) => waitlist.id !== action.payload
        ),
        selectedWaitlist:
          state.selectedWaitlist?.id === action.payload
            ? state.waitlists.length > 1
              ? state.waitlists.find((w) => w.id !== action.payload)
              : null
            : state.selectedWaitlist,
      };
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        errorType: null,
      };
    default:
      return state;
  }
};

const WaitlistContext = createContext();

export const useWaitlist = () => {
  const context = useContext(WaitlistContext);
  if (!context) {
    throw new Error("useWaitlist must be used within a WaitlistProvider");
  }
  return context;
};

export const WaitlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(waitlistReducer, initialState);
  const { toast } = useToast();
  const supabase = createClient();

  // Destructure state for easier access
  const {
    waitlists,
    selectedWaitlist,
    isLoading,
    error,
    errorType,
    user,
    searchTerm,
    retryCount,
  } = state;

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        dispatch({ type: ACTIONS.SET_USER, payload: user });
      } catch (err) {
        console.error("Error getting user:", err);
        // Don't set error state here as it's not critical for UI
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dispatch({ type: ACTIONS.SET_USER, payload: session?.user || null });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch waitlists when user is available
  useEffect(() => {
    if (user) {
      fetchWaitlists();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    } else {
      // Reset state when user logs out
      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: [] });
    }
  }, [user]);

  // Determine error type
  const categorizeError = useCallback((error) => {
    if (!error) return { message: null, type: null };

    const message = error.message || String(error);
    let type = ERROR_TYPES.UNKNOWN_ERROR;

    if (message.includes("network") || message.includes("fetch")) {
      type = ERROR_TYPES.NETWORK_ERROR;
    } else if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("JWT")
    ) {
      type = ERROR_TYPES.AUTH_ERROR;
    } else if (
      message.includes("permission") ||
      message.includes("access") ||
      message.includes("RLS")
    ) {
      type = ERROR_TYPES.PERMISSION_ERROR;
    } else if (message.includes("rate limit") || message.includes("too many")) {
      type = ERROR_TYPES.RATE_LIMIT;
    }

    return { message, type };
  }, []);

  // Fetch waitlists from Supabase
  const fetchWaitlists = useCallback(async () => {
    if (!user) return;

    dispatch({ type: ACTIONS.FETCH_INIT });

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

      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: data || [] });
    } catch (err) {
      console.error("Error fetching waitlists:", err);
      const errorInfo = categorizeError(err);
      dispatch({ type: ACTIONS.FETCH_ERROR, payload: errorInfo });

      // Show toast notification for error
      toast({
        title: "Failed to load waitlists",
        description: errorInfo.message,
        variant: "destructive",
      });
    }
  }, [user, supabase, categorizeError, toast]);

  // Setup real-time subscription for waitlist changes
  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return () => {};

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
  }, [user, supabase, fetchWaitlists]);

  // Retry fetching data after error
  const retryFetch = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
    fetchWaitlists();
  }, [fetchWaitlists]);

  // Create a new waitlist with optimistic updates
  const createWaitlist = useCallback(
    async (waitlistData) => {
      if (!user) return null;

      // Generate a temporary ID for optimistic updates
      const tempId = `temp_${Date.now()}`;

      // Create optimistic waitlist object
      const optimisticWaitlist = {
        id: tempId,
        owner_id: user.id,
        name: waitlistData.name,
        description: waitlistData.description || "",
        status: "draft",
        published: false,
        url_slug: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        waitlist_analytics: [{ total_signups: 0 }],
        _isOptimistic: true,
      };

      // Optimistically add to state
      dispatch({ type: ACTIONS.ADD_WAITLIST, payload: optimisticWaitlist });

      try {
        // Actual API call
        const { data, error } = await supabase
          .from("waitlists")
          .insert([
            {
              owner_id: user.id,
              name: waitlistData.name,
              description: waitlistData.description || "",
              status: "draft",
            },
          ])
          .select(
            `
          id,
          name,
          description,
          status,
          published,
          url_slug,
          created_at,
          updated_at
        `
          )
          .single();

        if (error) throw error;

        // Replace optimistic entry with real data
        dispatch({
          type: ACTIONS.UPDATE_WAITLIST,
          payload: {
            ...data,
            waitlist_analytics: [{ total_signups: 0 }],
            _isOptimistic: false,
          },
        });

        toast({
          title: "Waitlist Created",
          description: "Your new waitlist has been created successfully.",
          variant: "success",
        });

        return data;
      } catch (err) {
        console.error("Error creating waitlist:", err);

        // Remove optimistic entry on error
        dispatch({ type: ACTIONS.DELETE_WAITLIST, payload: tempId });

        const errorInfo = categorizeError(err);
        toast({
          title: "Failed to Create Waitlist",
          description: errorInfo.message,
          variant: "destructive",
        });

        return null;
      }
    },
    [user, supabase, categorizeError, toast]
  );

  // Update existing waitlist with optimistic updates
  const updateWaitlist = useCallback(
    async (waitlistId, updates) => {
      if (!user) return false;

      // Find the waitlist to update
      const waitlistToUpdate = waitlists.find((w) => w.id === waitlistId);
      if (!waitlistToUpdate) return false;

      // Apply optimistic update
      const optimisticUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      dispatch({
        type: ACTIONS.UPDATE_WAITLIST,
        payload: { id: waitlistId, ...optimisticUpdates },
      });

      try {
        // Actual API call
        const { data, error } = await supabase
          .from("waitlists")
          .update(updates)
          .eq("id", waitlistId)
          .eq("owner_id", user.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Waitlist Updated",
          description: "Your waitlist has been updated successfully.",
          variant: "success",
        });

        return true;
      } catch (err) {
        console.error("Error updating waitlist:", err);

        // Revert optimistic update on error
        dispatch({
          type: ACTIONS.UPDATE_WAITLIST,
          payload: waitlistToUpdate,
        });

        const errorInfo = categorizeError(err);
        toast({
          title: "Failed to Update Waitlist",
          description: errorInfo.message,
          variant: "destructive",
        });

        return false;
      }
    },
    [user, waitlists, supabase, categorizeError, toast]
  );

  // Delete waitlist with optimistic updates
  const deleteWaitlist = useCallback(
    async (waitlistId) => {
      if (!user) return false;

      // Find the waitlist to delete
      const waitlistToDelete = waitlists.find((w) => w.id === waitlistId);
      if (!waitlistToDelete) return false;

      // Apply optimistic deletion
      dispatch({ type: ACTIONS.DELETE_WAITLIST, payload: waitlistId });

      try {
        // Actual API call
        const { error } = await supabase
          .from("waitlists")
          .delete()
          .eq("id", waitlistId)
          .eq("owner_id", user.id);

        if (error) throw error;

        toast({
          title: "Waitlist Deleted",
          description: "Your waitlist has been deleted successfully.",
          variant: "success",
        });

        return true;
      } catch (err) {
        console.error("Error deleting waitlist:", err);

        // Revert optimistic deletion on error
        dispatch({ type: ACTIONS.ADD_WAITLIST, payload: waitlistToDelete });

        const errorInfo = categorizeError(err);
        toast({
          title: "Failed to Delete Waitlist",
          description: errorInfo.message,
          variant: "destructive",
        });

        return false;
      }
    },
    [user, waitlists, supabase, categorizeError, toast]
  );

  // Select a specific waitlist
  const selectWaitlist = useCallback((waitlist) => {
    dispatch({ type: ACTIONS.SELECT_WAITLIST, payload: waitlist });
  }, []);

  // Set search term
  const setSearchTerm = useCallback((term) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: term });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  // Get signup count for a waitlist
  const getSignupCount = useCallback(
    (waitlistId) => {
      const waitlist = waitlists.find((w) => w.id === waitlistId);
      return waitlist?.waitlist_analytics?.[0]?.total_signups || 0;
    },
    [waitlists]
  );

  // Check if waitlist is published
  const isWaitlistPublished = useCallback((waitlist) => {
    return waitlist?.published === true && waitlist?.status === "published";
  }, []);

  // Filter waitlists based on search term (memoized)
  const filteredWaitlists = useMemo(() => {
    if (!searchTerm.trim()) return waitlists;
    return waitlists.filter(
      (waitlist) =>
        waitlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (waitlist.description &&
          waitlist.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [waitlists, searchTerm]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      waitlists,
      filteredWaitlists,
      selectedWaitlist,
      isLoading,
      error,
      errorType,
      user,
      searchTerm,
      selectWaitlist,
      setSearchTerm,
      refreshWaitlists: fetchWaitlists,
      getSignupCount,
      isWaitlistPublished,
      createWaitlist,
      updateWaitlist,
      deleteWaitlist,
      retryFetch,
      clearError,
    }),
    [
      waitlists,
      filteredWaitlists,
      selectedWaitlist,
      isLoading,
      error,
      errorType,
      user,
      searchTerm,
      selectWaitlist,
      setSearchTerm,
      fetchWaitlists,
      getSignupCount,
      isWaitlistPublished,
      createWaitlist,
      updateWaitlist,
      deleteWaitlist,
      retryFetch,
      clearError,
    ]
  );

  return (
    <WaitlistContext.Provider value={value}>
      {children}
    </WaitlistContext.Provider>
  );
};

export default WaitlistProvider;
