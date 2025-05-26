# Waitlist Module Structure

This directory contains the refactored waitlist client implementation, organized using domain-driven design principles for better maintainability and readability.

## Directory Structure

```
app/waitlist/[slug]/
├── components/           # UI Components
│   ├── DynamicForm.jsx          # Form component for waitlist signups
│   ├── SocialShareSection.jsx   # Social sharing buttons
│   ├── WaitlistContent.jsx      # Main waitlist content display
│   └── WaitlistStates.jsx       # Loading, error, and not found states
├── hooks/               # Custom React Hooks
│   └── useWaitlistData.js       # Hook for waitlist data management
├── services/            # API and Data Services
│   └── waitlist-api.js          # API calls for waitlist data
├── types/               # Type Definitions and Constants
│   └── index.js                 # Waitlist states and constants
├── utils/               # Utility Functions
│   ├── index.js                 # General utilities
│   ├── styling.js               # CSS variable management
│   └── social-sharing.js        # Social sharing utilities
├── client.jsx           # Main client component (refactored)
├── page.jsx             # Server component page
├── index.js             # Module exports
└── README.md            # This documentation
```

## Key Components

### Main Component

- **`client.jsx`**: The main `PublicWaitlistClient` component, now much cleaner and focused on orchestration

### Custom Hooks

- **`useWaitlistData`**: Manages all waitlist data fetching, state management, and styling application

### Services

- **`waitlist-api.js`**: Handles API calls to both Supabase and fallback REST endpoints

### Components

- **`WaitlistContent`**: Main content display component
- **`WaitlistStates`**: Loading, error, and not found state components
- **`SocialShareSection`**: Social sharing functionality
- **`DynamicForm`**: Form component (existing, unchanged)

### Utilities

- **`utils/index.js`**: General utility functions (ID generation, data processing)
- **`utils/styling.js`**: CSS variable management and application
- **`utils/social-sharing.js`**: Social media sharing functions

### Types

- **`types/index.js`**: Constants and type definitions for waitlist states

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Reusability**: Components and utilities can be easily reused
3. **Testability**: Smaller, focused modules are easier to test
4. **Maintainability**: Changes to specific functionality are isolated
5. **Readability**: The main component is now much easier to understand
6. **Domain-Driven**: Structure follows the waitlist domain logic

## Usage

Import the main component:

```javascript
import { PublicWaitlistClient } from "./app/waitlist/[slug]";
```

Or import specific utilities:

```javascript
import { useWaitlistData, applyCSSVariables } from "./app/waitlist/[slug]";
```

## Migration Notes

- All functionality from the original 710-line `client.jsx` has been preserved
- The component behavior remains exactly the same
- Imports in other files may need to be updated if they were importing internal functions
- The modular structure makes it easier to add new features or modify existing ones
