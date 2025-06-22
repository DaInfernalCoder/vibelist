# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeList is a Next.js application that allows users to create customizable waitlists to validate products. It's built with modern React patterns, Supabase for backend services, Stripe for payments, and styled with Tailwind CSS and DaisyUI.

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Operations
- `npm run db:migrate` - Apply database migrations using direct connection
- `npm run db:test` - Test database schema integrity

### Testing
- `npm run test:lead-api` - Test lead generation API endpoints
- `npm run test:dynamic-form` - Test dynamic form rendering
- `npm run test:dynamic-form-api` - Test dynamic form API endpoints
- `npm run test:waitlist-forms` - Run all waitlist form tests

## Architecture

### Authentication & Database
- **Supabase**: Primary backend (authentication, PostgreSQL database, real-time subscriptions)
- **Auth flow**: Email-based authentication with callback handling at `/api/auth/callback`
- **Middleware**: Session management via Supabase SSR middleware

### State Management
- **WaitlistContext** (`contexts/WaitlistContext.jsx`): Central state management for waitlist operations with optimistic updates
- **SubscriptionContext** (`contexts/SubscriptionContext.js`): Stripe subscription state management
- Uses React `useReducer` pattern for complex state management

### Key Features
1. **Waitlist Creation & Management**: Users can create, customize, and publish waitlists
2. **Dynamic Form Rendering**: Customizable signup forms with real-time preview
3. **Analytics Dashboard**: Real-time signup tracking and analytics
4. **Payment Integration**: Stripe-based subscription system with multiple plans
5. **Real-time Updates**: Live data synchronization using Supabase real-time subscriptions

### File Structure
- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components (includes shadcn/ui components in `/ui`)
- `/contexts` - React Context providers for global state
- `/libs` - Core utilities (Supabase clients, Stripe, email, etc.)
- `/supabase/migrations` - Database schema and migration files
- `/scripts` - Utility scripts for testing and migrations

### Database Schema
The application uses PostgreSQL via Supabase with the following key tables:
- `profiles` - User profile data
- `waitlists` - Waitlist configurations and metadata
- `waitlist_signups` - User signups to waitlists
- `customization_settings` - Visual customization options
- `waitlist_analytics` - Cached analytics data

Row-Level Security (RLS) policies ensure users can only access their own data.

### Styling & UI
- **Tailwind CSS** with custom animations and gradients
- **DaisyUI** for component theming (light/dark mode support)
- **shadcn/ui** components for modern UI patterns
- **Framer Motion** for animations
- Custom color system defined in `tailwind.config.js`

### API Routes
- `/api/waitlists/*` - Waitlist CRUD operations and publishing
- `/api/stripe/*` - Payment processing and subscription management
- `/api/auth/callback` - Authentication callback handling
- `/api/lead` - Lead capture and form submissions

### Environment Configuration
The app supports multiple environments with dynamic configuration in `lib/env-utils.js`. Key integrations:
- Supabase (database, auth, storage)
- Stripe (payments)
- Resend (email)
- PostHog (analytics)
- Crisp (customer support)

### Testing Strategy
Tests are located in `/scripts/tests/` and cover:
- API endpoint functionality
- Form rendering and validation
- Database operations
- Cross-device compatibility
- Rate limiting

To run a specific test, use `node scripts/tests/[test-name].js`.