// Apply CSS variables to the document for waitlist customization
export const applyCSSVariables = (stylesToApply, requestId) => {
  console.log(
    `[${requestId}] Setting up custom CSS variables from resolved styles:`,
    Object.keys(stylesToApply)
  );

  let styleEl = document.getElementById("waitlist-custom-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "waitlist-custom-styles";
    document.head.appendChild(styleEl);
    console.log(`[${requestId}] Created new style element for custom CSS`);
  }

  const cssVariables = `
    :root {
      --waitlist-background-color: ${stylesToApply.bgColor || "#ffffff"};
      --waitlist-text-color: ${stylesToApply.headingTextColor || "#000000"}; /* Adjusted to headingTextColor for main text */
      --waitlist-theme-color: ${stylesToApply.themeColor || stylesToApply.buttonColor || "#3B82F6"};
      --waitlist-secondary-color: ${stylesToApply.secondaryColor || stylesToApply.buttonColor || "#9333ea"};
      --waitlist-accent-color: ${stylesToApply.accentColor || stylesToApply.pingDotColor || "#f97316"};
      --waitlist-font-family: ${stylesToApply.fontFamily || "Inter, system-ui, sans-serif"};
      
      --waitlist-button-text-color: ${stylesToApply.buttonTextColor || "#ffffff"};
      --waitlist-button-border-radius: ${stylesToApply.inputBorderRadius || "0.375rem"}; /* Use inputBorderRadius for button consistency */
      
      --waitlist-input-background-color: ${stylesToApply.inputColor || "#f8fafc"};
      --waitlist-input-border-color: ${stylesToApply.inputBorderColor || "#e2e8f0"};
      --waitlist-input-border-radius: ${stylesToApply.inputBorderRadius || "0.375rem"};
      
      --waitlist-card-background-color: ${stylesToApply.cardBackgroundColor || "#ffffff"};
      --waitlist-card-border-color: ${stylesToApply.cardBorderColor || "#e2e8f0"};
      --waitlist-card-border-radius: ${stylesToApply.cardBorderRadius || "0.5rem"};

      --waitlist-signup-text-color: ${stylesToApply.signupTextColor || "#4b5563"};
      --waitlist-ping-dot-color: ${stylesToApply.pingDotColor || "#10b981"};
    }
    
    .waitlist-page {
      background-color: var(--waitlist-background-color);
      color: var(--waitlist-text-color); /* Main page text color */
      font-family: var(--waitlist-font-family);
    }
    
    .waitlist-card {
      background-color: var(--waitlist-card-background-color) !important;
      border-color: var(--waitlist-card-border-color);
      border-radius: var(--waitlist-card-border-radius);
      border-width: 1px; 
      border-style: solid;
    }

    .waitlist-card-title {
       color: var(--waitlist-text-color); /* For CardTitle */
    }

    .waitlist-card-description {
       color: var(--waitlist-signup-text-color); /* For CardDescription */
    }
    
    .waitlist-input {
      background-color: var(--waitlist-input-background-color);
      border-color: var(--waitlist-input-border-color);
      border-radius: var(--waitlist-input-border-radius);
      color: var(--waitlist-text-color);
    }
    
    .waitlist-button {
      background-color: var(--waitlist-theme-color);
      color: var(--waitlist-button-text-color);
      border-radius: var(--waitlist-button-border-radius);
    }
    
    .waitlist-button:hover {
      background-color: var(--waitlist-secondary-color);
    }
    
    .waitlist-accent-color {
      color: var(--waitlist-accent-color);
    }

    .waitlist-poweredby-link {
      color: var(--waitlist-accent-color) !important;
    }
    .waitlist-social-proof-text {
      color: var(--waitlist-signup-text-color);
    }
    .waitlist-ping-dot {
      background-color: var(--waitlist-ping-dot-color);
    }
  `;

  styleEl.textContent = cssVariables;
  console.log(
    `[${requestId}] Applied custom CSS variables to page via applyCSSVariables.`
  );
};
