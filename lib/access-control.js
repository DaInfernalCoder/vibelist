import { createClient } from "@/libs/supabase/server";

/**
 * Check if a user has valid paid access to the app
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - True if user has valid access
 */
export async function hasValidSubscription(userId) {
  if (!userId) return false;

  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_access, access_expires_at")
    .eq("id", userId)
    .single();

  if (error || !profile) return false;

  // If user doesn't have access, return false
  if (!profile.has_access) return false;

  // If access_expires_at is null, it's lifetime access
  if (!profile.access_expires_at) return true;

  // Check if subscription hasn't expired
  return new Date(profile.access_expires_at) > new Date();
}

/**
 * Get detailed subscription information for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Subscription details object
 */
export async function getSubscriptionDetails(userId) {
  if (!userId) {
    return {
      type: "none",
      status: "inactive",
      expires_at: null,
    };
  }

  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_access, access_expires_at, price_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return {
      type: "none",
      status: "inactive",
      expires_at: null,
    };
  }

  // If user doesn't have access
  if (!profile.has_access) {
    return {
      type: "none",
      status: "inactive",
      expires_at: null,
    };
  }

  // All paid plans now have lifetime access
  return {
    type: "pro",
    status: "active",
    expires_at: null,
  };
}

/**
 * Get remaining days for Pro plan users
 * @param {string} userId - The user's ID
 * @returns {Promise<number|null>} - Days remaining or null for lifetime access
 */
export async function getRemainingDays(userId) {
  if (!userId) return null;

  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("access_expires_at")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  // If no expiration date (lifetime access), return null
  if (!profile.access_expires_at) return null;

  // Calculate remaining days
  const expiresAt = new Date(profile.access_expires_at);
  const now = new Date();
  const diffTime = expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Return 0 if expired
  return diffDays < 0 ? 0 : diffDays;
}

/**
 * Check if user needs to be redirected to payment page
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - True if user should be redirected to payment
 */
export async function requiresPayment(userId) {
  const hasAccess = await hasValidSubscription(userId);
  return !hasAccess;
}
