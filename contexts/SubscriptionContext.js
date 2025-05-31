"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/libs/supabase/client";
import {
  handleClientError,
  ErrorCreators,
  ErrorTypes,
  ErrorLogger,
} from "@/lib/errorHandler";

const SubscriptionContext = createContext();

// Cache configuration
const CACHE_KEY = "vibelist_subscription_status";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper functions for local storage with TTL
const getCachedSubscription = () => {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    const appError = ErrorCreators.internalError(
      "Failed to read subscription cache",
      error
    );
    ErrorLogger.log(appError, { context: "subscription_cache" });
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedSubscription = (data) => {
  if (typeof window === "undefined") return;

  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    const appError = ErrorCreators.internalError(
      "Failed to cache subscription data",
      error
    );
    ErrorLogger.log(appError, { context: "subscription_cache" });
  }
};

const clearSubscriptionCache = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
    // Also clear any related payment flags
    localStorage.removeItem("show_payment_success_notification");
    // Clear session storage items that might contain stale data
    sessionStorage.removeItem("subscription_refresh_pending");
  } catch (error) {
    const appError = ErrorCreators.internalError(
      "Failed to clear subscription cache",
      error
    );
    ErrorLogger.log(appError, { context: "subscription_cache" });
  }
};

// Force clear all subscription-related cache and storage
const forceInvalidateAllCache = () => {
  if (typeof window === "undefined") return;
  try {
    // Clear localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes("subscription") ||
          key.includes("payment") ||
          key === CACHE_KEY)
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear sessionStorage items
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes("subscription") || key.includes("payment"))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    const appError = ErrorCreators.internalError(
      "Failed to force invalidate cache",
      error
    );
    ErrorLogger.log(appError, { context: "subscription_cache_force_clear" });
  }
};

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionState, setSubscriptionState] = useState({
    hasAccess: false,
    expiresAt: null,
    customerId: null,
    priceId: null,
    isExpired: false,
    loading: true,
    error: null,
    lastRefresh: null,
  });

  const [user, setUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Debug logging
  const debugLog = useCallback((message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[SubscriptionContext] ${message}`, data);
    }
  }, []);

  // Enhanced error handler for subscription context
  const handleSubscriptionError = useCallback((error, context = {}) => {
    const errorInfo = handleClientError(error, {
      ...context,
      component: "SubscriptionContext",
    });

    // Set user-friendly error state
    setSubscriptionState((prev) => ({
      ...prev,
      loading: false,
      error: errorInfo,
    }));

    return errorInfo;
  }, []);

  // Initialize Supabase client and auth listener
  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const getInitialUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          const authError = ErrorCreators.unauthorized(
            "Failed to authenticate user"
          );
          handleSubscriptionError(authError, { operation: "getInitialUser" });
          setUser(null);
        } else {
          debugLog(
            "Initial user:",
            user ? "authenticated" : "not authenticated"
          );
          setUser(user);
        }
      } catch (error) {
        const appError = ErrorCreators.internalError(
          "Error getting initial user",
          error
        );
        handleSubscriptionError(appError, { operation: "getInitialUser" });
        setUser(null);
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog("Auth state changed", { event, hasSession: !!session });

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        // Clear any previous errors when user signs in
        setSubscriptionState((prev) => ({
          ...prev,
          error: null,
        }));
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        // Clear subscription state when user logs out
        setSubscriptionState({
          hasAccess: false,
          expiresAt: null,
          customerId: null,
          priceId: null,
          isExpired: false,
          loading: false,
          error: null,
          lastRefresh: null,
        });
        clearSubscriptionCache();
        setRetryCount(0); // Reset retry count on logout
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [debugLog, handleSubscriptionError]);

  // Force refresh subscription status with complete cache invalidation
  const forceRefreshSubscriptionStatus = useCallback(async () => {
    debugLog("Force refreshing subscription status - clearing all caches");

    // Clear all caches immediately
    forceInvalidateAllCache();

    // Reset state to loading
    setSubscriptionState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      hasAccess: false, // Reset to false while loading
    }));

    // Force a fresh fetch
    return await refreshSubscriptionStatus(true);
  }, [debugLog, refreshSubscriptionStatus]);

  // Refresh subscription status from API with enhanced error handling
  const refreshSubscriptionStatus = useCallback(
    async (force = false) => {
      // Don't make API calls if user is not authenticated
      if (!user) {
        debugLog("No authenticated user, skipping subscription refresh");
        setSubscriptionState((prev) => ({
          ...prev,
          hasAccess: false,
          loading: false,
          error: null,
        }));
        return { hasAccess: false };
      }

      debugLog("Refreshing subscription status", { force, retryCount });

      // Check cache first unless forced
      if (!force) {
        const cached = getCachedSubscription();
        if (cached) {
          debugLog("Using cached subscription data", cached);
          setSubscriptionState((prev) => ({
            ...prev,
            ...cached,
            loading: false,
            error: null,
          }));
          return cached;
        }
      } else {
        // If forced, clear cache first
        clearSubscriptionCache();
      }

      setSubscriptionState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch("/api/subscription/status");

        if (!response.ok) {
          // Handle different HTTP error statuses
          let error;
          switch (response.status) {
            case 401:
              error = ErrorCreators.unauthorized("Authentication required");
              break;
            case 403:
              error = ErrorCreators.forbidden("Access denied");
              break;
            case 404:
              error = ErrorCreators.notFound("Subscription endpoint");
              break;
            case 429:
              error = ErrorCreators.rateLimitExceeded(
                "Too many subscription status requests"
              );
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              error = ErrorCreators.externalApiError(
                "subscription",
                "Subscription service temporarily unavailable"
              );
              break;
            default:
              error = ErrorCreators.internalError(
                `HTTP ${response.status}: ${response.statusText}`
              );
          }
          throw error;
        }

        const data = await response.json();

        // Validate response data
        if (typeof data.hasAccess !== "boolean") {
          throw ErrorCreators.validationError(
            "Invalid subscription status response"
          );
        }

        const newState = {
          hasAccess: data.hasAccess,
          expiresAt: data.expiresAt,
          customerId: data.customerId,
          priceId: data.priceId,
          isExpired: data.isExpired,
          loading: false,
          error: null,
          lastRefresh: new Date().toISOString(),
        };

        debugLog("Subscription status refreshed", newState);

        setSubscriptionState(newState);
        setCachedSubscription(newState);
        setRetryCount(0); // Reset retry count on success

        return newState;
      } catch (error) {
        const errorInfo = handleSubscriptionError(error, {
          operation: "refreshSubscriptionStatus",
          retryCount,
          force,
        });

        // Implement exponential backoff retry logic for certain errors
        if (retryCount < maxRetries && shouldRetry(error)) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          debugLog(`Retrying subscription refresh in ${delay}ms`, {
            retryCount,
            error: errorInfo,
          });

          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            refreshSubscriptionStatus(force);
          }, delay);
        } else {
          debugLog("Max retries reached or non-retryable error", {
            retryCount,
            error: errorInfo,
          });
        }

        return { hasAccess: false, error: errorInfo };
      }
    },
    [user, retryCount, debugLog, handleSubscriptionError]
  );

  // Determine if an error should trigger a retry
  const shouldRetry = (error) => {
    if (!error.type) return false;

    // Retry for network/server errors, but not for auth/validation errors
    return [
      ErrorTypes.EXTERNAL_API,
      ErrorTypes.INTERNAL,
      ErrorTypes.RATE_LIMIT,
    ].includes(error.type);
  };

  // Auto-refresh subscription status when user changes
  useEffect(() => {
    if (user) {
      refreshSubscriptionStatus();
    }
  }, [user, refreshSubscriptionStatus]);

  // Listen for storage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CACHE_KEY) {
        try {
          const cached = getCachedSubscription();
          if (cached) {
            debugLog("Subscription updated from another tab", cached);
            setSubscriptionState((prev) => ({
              ...prev,
              ...cached,
              loading: false,
              error: null,
            }));
          }
        } catch (error) {
          const appError = ErrorCreators.internalError(
            "Failed to sync subscription from storage",
            error
          );
          handleSubscriptionError(appError, { operation: "storageSync" });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [debugLog, handleSubscriptionError]);

  // Computed values
  const isAuthenticated = !!user;
  const hasValidAccess =
    subscriptionState.hasAccess && !subscriptionState.isExpired;
  const isLoading = subscriptionState.loading;

  const value = {
    // State
    ...subscriptionState,
    user,
    isAuthenticated,
    hasValidAccess,
    isLoading,

    // Actions
    refreshSubscriptionStatus,
    forceRefreshSubscriptionStatus,
    clearCache: clearSubscriptionCache,
    forceInvalidateAllCache,

    // Error handling
    retryCount,
    maxRetries,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    const error = ErrorCreators.internalError(
      "useSubscription must be used within a SubscriptionProvider"
    );
    ErrorLogger.log(error, { context: "useSubscription_hook" });
    throw error;
  }
  return context;
};

// Export context for advanced usage
export { SubscriptionContext };
