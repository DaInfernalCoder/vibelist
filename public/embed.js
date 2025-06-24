/**
 * VibeList Waitlist Embed Script
 *
 * Usage:
 * <script src="https://vibelist.co/embed.js" data-waitlist="your-waitlist-slug"></script>
 *
 * Or programmatically:
 * <div id="vibelist-embed" data-waitlist="your-waitlist-slug"></div>
 * <script src="https://vibelist.co/embed.js"></script>
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    baseUrl: "https://vibelist.co",
    apiPath: "/api/embed",
    waitlistPath: "/waitlist",
    cssPrefix: "vibelist-embed",
    maxRetries: 3,
    retryDelay: 1000,
  };

  // Detect current script's base URL for development/staging environments
  function getBaseUrl() {
    const currentScript =
      document.currentScript ||
      document.querySelector('script[src*="embed.js"]');

    if (currentScript && currentScript.src) {
      const url = new URL(currentScript.src);
      return `${url.protocol}//${url.host}`;
    }

    return CONFIG.baseUrl;
  }

  // Generate unique IDs for multiple embeds on the same page
  function generateEmbedId() {
    return `${CONFIG.cssPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  // Utility function to safely escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility function to format numbers with commas
  function formatNumber(num) {
    if (num === 0) return "0";
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }

  // CSS styles for the embed widget (scoped to avoid conflicts)
  const CSS_STYLES = `
    .${CONFIG.cssPrefix}-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 400px;
      margin: 0 auto;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      background: white;
      border: 1px solid #e5e7eb;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    
    .${CONFIG.cssPrefix}-container:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .${CONFIG.cssPrefix}-header {
      padding: 24px;
      text-align: center;
      background: linear-gradient(135deg, var(--theme-color, #4F46E5) 0%, var(--theme-color-dark, #3730A3) 100%);
      color: white;
      position: relative;
    }
    
    .${CONFIG.cssPrefix}-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 auto 16px auto;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      overflow: hidden;
    }
    
    .${CONFIG.cssPrefix}-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    
    .${CONFIG.cssPrefix}-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    
    .${CONFIG.cssPrefix}-description {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
      line-height: 1.4;
    }
    
    .${CONFIG.cssPrefix}-body {
      padding: 24px;
    }
    
    .${CONFIG.cssPrefix}-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: #6b7280;
    }
    
    .${CONFIG.cssPrefix}-stats-icon {
      width: 16px;
      height: 16px;
      margin-right: 6px;
      opacity: 0.7;
    }
    
    .${CONFIG.cssPrefix}-count {
      font-weight: 600;
      color: var(--theme-color, #4F46E5);
    }
    
    .${CONFIG.cssPrefix}-button {
      width: 100%;
      background: var(--theme-color, #4F46E5);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      box-sizing: border-box;
    }
    
    .${CONFIG.cssPrefix}-button:hover {
      background: var(--theme-color-dark, #3730A3);
      transform: translateY(-1px);
    }
    
    .${CONFIG.cssPrefix}-button:active {
      transform: translateY(0);
    }
    
    .${CONFIG.cssPrefix}-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    
    .${CONFIG.cssPrefix}-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid var(--theme-color, #4F46E5);
      border-radius: 50%;
      animation: ${CONFIG.cssPrefix}-spin 1s linear infinite;
      margin-right: 12px;
    }
    
    .${CONFIG.cssPrefix}-error {
      padding: 24px;
      text-align: center;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin: 16px;
    }
    
    .${CONFIG.cssPrefix}-error-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .${CONFIG.cssPrefix}-error-message {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .${CONFIG.cssPrefix}-powered-by {
      text-align: center;
      padding: 12px 24px;
      border-top: 1px solid #f3f4f6;
      background: #f9fafb;
    }
    
    .${CONFIG.cssPrefix}-powered-by a {
      color: #6b7280;
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
    }
    
    .${CONFIG.cssPrefix}-powered-by a:hover {
      color: var(--theme-color, #4F46E5);
    }
    
    @keyframes ${CONFIG.cssPrefix}-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Responsive design */
    @media (max-width: 480px) {
      .${CONFIG.cssPrefix}-container {
        margin: 0 16px;
        max-width: none;
      }
      
      .${CONFIG.cssPrefix}-header,
      .${CONFIG.cssPrefix}-body {
        padding: 20px;
      }
      
      .${CONFIG.cssPrefix}-title {
        font-size: 18px;
      }
    }
  `;

  // Inject CSS styles into the page (only once)
  function injectStyles() {
    if (document.querySelector(`#${CONFIG.cssPrefix}-styles`)) {
      return; // Styles already injected
    }

    const style = document.createElement("style");
    style.id = `${CONFIG.cssPrefix}-styles`;
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
  }

  // Fetch waitlist data from the API
  async function fetchWaitlistData(slug, retryCount = 0) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${CONFIG.apiPath}/${encodeURIComponent(slug)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache busting for development
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Waitlist not found or not published");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retryCount < CONFIG.maxRetries) {
        console.warn(
          `VibeList Embed: Retrying fetch for ${slug} (attempt ${retryCount + 1}/${CONFIG.maxRetries})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.retryDelay * (retryCount + 1))
        );
        return fetchWaitlistData(slug, retryCount + 1);
      }
      throw error;
    }
  }

  // Generate the embed HTML
  function generateEmbedHTML(data, embedId) {
    const {
      name,
      description,
      signupCount,
      themeColor,
      logoUrl,
      showSocialProof,
      waitlistUrl,
    } = data;

    // Calculate theme color variations
    const themeColorDark = adjustBrightness(themeColor, -20);

    // Set CSS custom properties for theming
    const themeStyles = `
      --theme-color: ${themeColor};
      --theme-color-dark: ${themeColorDark};
    `;

    // Generate logo content
    const logoContent = logoUrl
      ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(name)} logo" />`
      : escapeHtml(name.charAt(0).toUpperCase());

    // Generate stats section
    const statsSection =
      showSocialProof && signupCount > 0
        ? `
      <div class="${CONFIG.cssPrefix}-stats">
        <svg class="${CONFIG.cssPrefix}-stats-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="${CONFIG.cssPrefix}-count">${formatNumber(signupCount)}</span>
        <span>&nbsp;${signupCount === 1 ? "person has" : "people have"} joined</span>
      </div>
    `
        : "";

    return `
      <div class="${CONFIG.cssPrefix}-container" style="${themeStyles}" id="${embedId}">
        <div class="${CONFIG.cssPrefix}-header">
          <div class="${CONFIG.cssPrefix}-logo">
            ${logoContent}
          </div>
          <h3 class="${CONFIG.cssPrefix}-title">${escapeHtml(name)}</h3>
          ${description ? `<p class="${CONFIG.cssPrefix}-description">${escapeHtml(description)}</p>` : ""}
        </div>
        <div class="${CONFIG.cssPrefix}-body">
          ${statsSection}
          <a href="${escapeHtml(waitlistUrl)}" class="${CONFIG.cssPrefix}-button" target="_blank" rel="noopener noreferrer">
            Join Waitlist
          </a>
        </div>
        <div class="${CONFIG.cssPrefix}-powered-by">
          <a href="${getBaseUrl()}" target="_blank" rel="noopener noreferrer">
            Powered by VibeList
          </a>
        </div>
      </div>
    `;
  }

  // Generate loading state HTML
  function generateLoadingHTML(embedId) {
    return `
      <div class="${CONFIG.cssPrefix}-container" id="${embedId}">
        <div class="${CONFIG.cssPrefix}-loading">
          <div class="${CONFIG.cssPrefix}-spinner"></div>
          <span>Loading waitlist...</span>
        </div>
      </div>
    `;
  }

  // Generate error state HTML
  function generateErrorHTML(error, embedId) {
    return `
      <div class="${CONFIG.cssPrefix}-container" id="${embedId}">
        <div class="${CONFIG.cssPrefix}-error">
          <div class="${CONFIG.cssPrefix}-error-title">Unable to load waitlist</div>
          <div class="${CONFIG.cssPrefix}-error-message">${escapeHtml(error.message)}</div>
        </div>
        <div class="${CONFIG.cssPrefix}-powered-by">
          <a href="${getBaseUrl()}" target="_blank" rel="noopener noreferrer">
            Powered by VibeList
          </a>
        </div>
      </div>
    `;
  }

  // Utility function to adjust color brightness
  function adjustBrightness(hex, percent) {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse r, g, b values
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  // Create and render an embed widget
  async function createEmbed(element, slug) {
    const embedId = generateEmbedId();

    try {
      // Show loading state
      element.innerHTML = generateLoadingHTML(embedId);

      // Fetch waitlist data
      const data = await fetchWaitlistData(slug);

      // Render the embed
      element.innerHTML = generateEmbedHTML(data, embedId);

      // Track embed load (optional analytics)
      if (typeof gtag !== "undefined") {
        gtag("event", "embed_load", {
          custom_parameter: slug,
        });
      }
    } catch (error) {
      console.error("VibeList Embed Error:", error);
      element.innerHTML = generateErrorHTML(error, embedId);
    }
  }

  // Initialize embeds on the page
  function initializeEmbeds() {
    // Inject CSS styles
    injectStyles();

    // Find all script tags with data-waitlist attribute
    const scriptTags = document.querySelectorAll("script[data-waitlist]");

    scriptTags.forEach((script) => {
      const slug = script.getAttribute("data-waitlist");
      if (!slug) return;

      // Create container element
      const container = document.createElement("div");
      container.className = `${CONFIG.cssPrefix}-widget`;

      // Insert container after the script tag
      script.parentNode.insertBefore(container, script.nextSibling);

      // Create the embed
      createEmbed(container, slug);
    });

    // Find all div elements with data-waitlist attribute
    const divElements = document.querySelectorAll("div[data-waitlist]");

    divElements.forEach((div) => {
      const slug = div.getAttribute("data-waitlist");
      if (!slug) return;

      // Create the embed in the existing div
      createEmbed(div, slug);
    });
  }

  // Public API for programmatic usage
  window.VibeListEmbed = {
    create: function (element, slug) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      if (!element || !slug) {
        console.error("VibeList Embed: Invalid element or slug provided");
        return;
      }

      injectStyles();
      createEmbed(element, slug);
    },

    version: "1.0.0",
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeEmbeds);
  } else {
    // DOM is already ready
    initializeEmbeds();
  }
})();
