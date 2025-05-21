/**
 * URL utility functions for generating consistent URLs across the application
 * using the environment variables or fallbacks.
 */

/**
 * Get the base URL of the application from environment variables
 * with appropriate fallbacks for different execution contexts.
 * @returns {string} The base URL of the application
 */
export function getBaseUrl() {
  // Server-side: Use NEXT_PUBLIC_URL environment variable
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_URL || "https://vibelist.com";
  }

  // Client-side: Use NEXT_PUBLIC_URL if available, otherwise use window.location.origin
  return process.env.NEXT_PUBLIC_URL || window.location.origin;
}

/**
 * Generate a waitlist public URL from a slug
 * @param {string} slug - The URL slug of the waitlist
 * @returns {string} The complete URL for the public waitlist page
 */
export function getWaitlistUrl(slug) {
  if (!slug) return "";
  return `${getBaseUrl()}/waitlist/${slug}`;
}

/**
 * Generate a waitlist dashboard sharing URL from a waitlist ID
 * @param {string} id - The ID of the waitlist
 * @returns {string} The complete URL for the waitlist sharing dashboard page
 */
export function getWaitlistDashboardUrl(id) {
  if (!id) return "";
  return `${getBaseUrl()}/dashboard/waitlist/${id}/share`;
}

/**
 * Generate social sharing URLs for various platforms
 * @param {Object} options - Options for the share URLs
 * @param {string} options.url - The URL to share
 * @param {string} options.title - The title or name of the waitlist
 * @param {string} options.description - The description of the waitlist
 * @returns {Object} An object containing URLs for different social platforms
 */
export function getSocialShareUrls({ url, title, description }) {
  if (!url) return {};

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "Join our waitlist");
  const encodedDescription = encodeURIComponent(
    description || "Sign up to get early access"
  );

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}: ${description}`)}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
  };
}
