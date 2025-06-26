/**
 * Helper function to convert radius values to CSS classes
 */
export const getBorderRadiusClass = (radius) => {
  switch (radius) {
    case "None":
      return "rounded-none";
    case "Small":
      return "rounded-sm";
    case "Medium":
      return "rounded-md";
    case "Large":
      return "rounded-lg";
    default:
      return "rounded-md";
  }
};

/**
 * Helper function to convert font weight values to CSS classes
 */
export const getFontWeightClass = (weight) => {
  switch (weight) {
    case "Normal":
      return "font-normal";
    case "Medium":
      return "font-medium";
    case "Bold":
      return "font-bold";
    default:
      return "font-normal";
  }
};

/**
 * Default template configuration
 */
export const defaultTemplate = {
  // Setup tab
  projectTitle: "digitalseobull",
  heroText: "Signup to our waitlist",
  subText:
    "Updates, news, exclusive discounts, and so much more cool stuff happens behind-the-scenes",
  placeholderInputText: "Email",
  buttonText: "Join the waitlist",
  successMessage: "Success! You're on the waitlist 🎉",
  showLogo: true,
  logoSize: "1X",
  logoUrl: "",
  removeLogoWhitespace: false,
  showSocialProof: true,
  enableReferrals: false,
  whiteLabel: false,

  // Design tab
  bgColor: "#ffffff",
  headingTextColor: "#000000",
  inputColor: "#f5f5f5",
  inputBorderWidth: "1px",
  inputBorderColor: "#e5e5e5",
  inputBorderRadius: "Medium",
  buttonColor: "#000000",
  buttonTextColor: "#ffffff",
  buttonTextWeight: "Medium",
  buttonBorderWidth: "0px",
  signupTextColor: "#4b5563",
  pingDotColor: "#10b981",
};

/**
 * Theme options for quick styling
 */
export const themeOptions = [
  {
    name: "Dark Mode",
    preview: "A sleek dark theme with high contrast",
    config: {
      bgColor: "#111111",
      headingTextColor: "#ffffff",
      inputColor: "#2d2d2d",
      inputBorderWidth: "0px",
      inputBorderRadius: "Medium",
      buttonColor: "#3b82f6",
      buttonTextColor: "#ffffff",
      signupTextColor: "#d1d5db",
      pingDotColor: "#10b981",
      cardBackgroundColor: "#2a2a2a",
      cardBorderColor: "#4a5568",
    },
  },
  {
    name: "Light Minimal",
    preview: "Clean and modern light design",
    config: {
      bgColor: "#ffffff",
      headingTextColor: "#171717",
      inputColor: "#ffffff",
      inputBorderWidth: "1px",
      inputBorderColor: "#e5e5e5",
      inputBorderRadius: "Small",
      buttonColor: "#000000",
      buttonTextColor: "#ffffff",
      signupTextColor: "#4b5563",
      pingDotColor: "#10b981",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e2e8f0",
    },
  },
  {
    name: "Bold Purple",
    preview: "Eye-catching purple with modern look",
    config: {
      bgColor: "#f5f3ff",
      headingTextColor: "#5b21b6",
      inputColor: "#ffffff",
      inputBorderWidth: "1px",
      inputBorderColor: "#ddd6fe",
      inputBorderRadius: "Large",
      buttonColor: "#7c3aed",
      buttonTextColor: "#ffffff",
      buttonTextWeight: "Bold",
      signupTextColor: "#6b7280",
      pingDotColor: "#ec4899",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e2e8f0",
    },
  },
  {
    name: "Corporate Blue",
    preview: "Professional blue theme for business",
    config: {
      bgColor: "#f0f9ff",
      headingTextColor: "#0c4a6e",
      inputColor: "#ffffff",
      inputBorderWidth: "1px",
      inputBorderColor: "#bae6fd",
      inputBorderRadius: "Medium",
      buttonColor: "#0284c7",
      buttonTextColor: "#ffffff",
      buttonTextWeight: "Medium",
      signupTextColor: "#334155",
      pingDotColor: "#0ea5e9",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e2e8f0",
    },
  },
  {
    name: "Eco Green",
    preview: "Nature-inspired green palette",
    config: {
      bgColor: "#f0fdf4",
      headingTextColor: "#166534",
      inputColor: "#ffffff",
      inputBorderWidth: "1px",
      inputBorderColor: "#bbf7d0",
      inputBorderRadius: "Large",
      buttonColor: "#16a34a",
      buttonTextColor: "#ffffff",
      signupTextColor: "#374151",
      pingDotColor: "#84cc16",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e2e8f0",
    },
  },
];
