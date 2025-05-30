/**
 * Environment utilities for dynamic URL configuration
 * Handles both development (localhost) and production (vibe-list.com) environments
 */

/**
 * Get the base URL for the current environment
 * @returns {string} The base URL (e.g., 'http://localhost:3000' or 'https://vibe-list.com')
 */
export function getBaseUrl() {
  // In production, use the environment variable or fallback to production domain
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_URL;
  }

  // In development, use the environment variable or fallback to localhost
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  // Client-side fallback using window.location
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side fallback for development
  return "http://localhost:3000";
}

/**
 * Get the auth callback URL for the current environment
 * @returns {string} The complete auth callback URL
 */
export function getAuthCallbackUrl() {
  return `${getBaseUrl()}/auth/callback`;
}

/**
 * Check if we're running in development environment
 * @returns {boolean} True if in development
 */
export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if we're running in production environment
 * @returns {boolean} True if in production
 */
export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if we're running on localhost (client-side check)
 * @returns {boolean} True if on localhost
 */
export function isLocalhost() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
  );
}

/**
 * Get environment-specific configuration
 * @returns {object} Configuration object with environment-aware URLs
 */
export function getEnvironmentConfig() {
  const baseUrl = getBaseUrl();
  const isLocal = isDevelopment() || isLocalhost();

  return {
    baseUrl,
    authCallbackUrl: getAuthCallbackUrl(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isLocalhost: isLocal,
    domain: isLocal ? "localhost:3000" : "vibe-list.com",
    protocol: isLocal ? "http" : "https",
    // Supabase-specific URLs
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      redirectUrl: getAuthCallbackUrl(),
    },
  };
}

/**
 * Get the site URL with proper protocol
 * @returns {string} The site URL
 */
export function getSiteUrl() {
  return getBaseUrl();
}

/**
 * Build a full URL from a path
 * @param {string} path - The path to append to the base URL
 * @returns {string} The complete URL
 */
export function buildUrl(path) {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get redirect URL for authentication flows
 * @param {string} returnTo - Optional return path after auth
 * @returns {string} The redirect URL
 */
export function getAuthRedirectUrl(returnTo = "/dashboard/create") {
  const baseUrl = getBaseUrl();
  const encodedReturnTo = encodeURIComponent(returnTo);
  return `${baseUrl}/auth/callback?returnTo=${encodedReturnTo}`;
}
