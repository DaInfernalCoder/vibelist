// Social sharing utility functions
export const trackShareEvent = (platform) => {
  // TODO: Implement analytics tracking for social shares
  console.log(`Shared on ${platform}`);
};

export const shareOnTwitter = (url, title) => {
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  window.open(twitterUrl, "_blank", "width=550,height=420");
  trackShareEvent("twitter");
};

export const shareOnFacebook = (url) => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, "_blank", "width=550,height=420");
  trackShareEvent("facebook");
};

export const shareOnLinkedIn = (url, title) => {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  window.open(linkedinUrl, "_blank", "width=550,height=420");
  trackShareEvent("linkedin");
};

export const copyToClipboard = async (url, onSuccess, onError) => {
  try {
    await navigator.clipboard.writeText(url);
    trackShareEvent("copy");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    if (onError) onError(err);
  }
};
