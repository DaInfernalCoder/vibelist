# Waitlist Publish Feature Bug Fix

This document explains the bug fix implemented for the waitlist publishing feature and provides guidance on the correct data structure for future reference.

## Issue Summary

The waitlist publishing feature was experiencing a 500 error when users attempted to publish a waitlist. The error occurred because of a mismatch in the data structure between:

1. The `PublishWaitlistModal.jsx` component (frontend)
2. The `/api/waitlists/publish` route handler (backend)

The specific error was:

```
POST http://localhost:3000/api/waitlists/publish 500 (Internal Server Error)
Error publishing waitlist: Error: An unexpected error occurred
```

## Root Cause

The root cause of the issue was a data structure mismatch:

1. The frontend component (`PublishWaitlistModal.jsx`) was sending the entire `templateData` object as the `customizationData` property.
2. The API expected:
   - A separate `templateId` property (extracted from templateData)
   - A `customizationData` property containing only the customization settings

This mismatch caused validation failures on the server side, resulting in a 500 error.

## Fix Implementation

The fix involved changes to both the frontend component and the backend API route:

### 1. Frontend Changes (`PublishWaitlistModal.jsx`)

```javascript
// Before
const payload = {
  name,
  description: description.trim() || undefined,
  customizationData: templateData || undefined, // Incorrect - sending entire template object
};

// After
const templateId = templateData?.id;
const payload = {
  name,
  description: description.trim() || undefined,
};

// Only include templateId if available
if (templateId) {
  payload.templateId = templateId;
}

// Include customizationData properly
if (templateData) {
  // Exclude the id property from customizationData
  const { id, ...customizationData } = templateData;
  payload.customizationData = customizationData;
}
```

### 2. Backend Changes (`route.js`)

1. Added better validation for the request body
2. Added improved error handling and logging
3. Added documentation about the expected request structure

```javascript
/**
 * Expected request body:
 * {
 *   name: string,             // Required: Name of the waitlist
 *   description?: string,     // Optional: Description of the waitlist
 *   templateId?: string,      // Optional: ID of the template to use
 *   customizationData: object // Required: Customization settings for the waitlist
 * }
 */
```

## Correct Data Structure

For future development, the correct data structure for publishing a waitlist is:

```javascript
// Client-side code
const payload = {
  // Required fields
  name: "My Waitlist Name", // Required: The name of the waitlist

  // Optional fields
  description: "Optional description", // Optional: A description for the waitlist
  templateId: "uuid-of-template", // Optional: UUID of the template if used

  // Required fields
  customizationData: {
    // Required: Customization options
    theme_color: "#4f46e5",
    secondary_color: "#9333ea",
    background_color: "#ffffff",
    text_color: "#111827",
    logo_url: "",
    show_social_proof: true,
    show_referral: false,
    // Other customization properties...
  },
};
```

## Testing

A test script is available at `scripts/test-publish-waitlist.js` to demonstrate the correct data structure and test the API directly.

To run the test:

1. Update the `AUTH_TOKEN` in the script with a valid auth token
2. Run `node scripts/test-publish-waitlist.js`

## Future Considerations

To prevent similar issues in the future, consider:

1. Adding TypeScript definitions for the API request/response structures
2. Implementing API contract testing
3. Using a validation library like Zod or Joi for request validation
4. Creating shared types/interfaces between client and server code
