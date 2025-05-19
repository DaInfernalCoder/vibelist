/**
 * @typedef {Object} Template
 * @property {string} projectTitle - Title of the project/waitlist
 * @property {string} heroText - Main headline of the waitlist page
 * @property {string} subText - Subtitle or description text
 * @property {string} placeholderInputText - Placeholder text for the input field
 * @property {string} buttonText - Text displayed on the submit button
 * @property {string} successMessage - Message shown after successful signup
 * @property {boolean} showLogo - Whether to display a logo
 * @property {string} logoSize - Size of the logo (1X, 1.5X, or 2X)
 * @property {boolean} showSocialProof - Whether to show social proof section
 * @property {boolean} enableReferrals - Whether to enable referral functionality
 * @property {boolean} whiteLabel - Whether to enable white labeling
 * @property {string} bgColor - Background color of the waitlist page
 * @property {string} headingTextColor - Color of the heading text
 * @property {string} inputColor - Background color of the input field
 * @property {string} inputBorderWidth - Border width of the input field
 * @property {string} inputBorderColor - Border color of the input field
 * @property {string} inputBorderRadius - Border radius of the input field (None, Small, Medium, Large)
 * @property {string} buttonColor - Background color of the button
 * @property {string} buttonTextColor - Text color of the button
 * @property {string} buttonTextWeight - Font weight of the button text (Normal, Medium, Bold)
 * @property {string} buttonBorderWidth - Border width of the button
 * @property {string} signupTextColor - Color of the regular text
 * @property {string} pingDotColor - Color of the ping dot in the social proof section
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {string} bgColor - Background color
 * @property {string} headingTextColor - Heading text color
 * @property {string} buttonColor - Button background color
 * @property {string} buttonTextColor - Button text color
 */

/**
 * @typedef {Object} Theme
 * @property {string} name - Theme name
 * @property {string} preview - Theme description
 * @property {ThemeConfig} config - Theme configuration
 */

/**
 * @typedef {Object} TemplateContextType
 * @property {Template} template - The current template state
 * @property {function(string, any): void} updateTemplate - Function to update a template property
 */

// Export empty objects to satisfy module requirement
export {};
