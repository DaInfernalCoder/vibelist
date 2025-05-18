# Supabase Integration for Vibelist

This directory contains the core Supabase client implementations for the Vibelist application.

## Overview

Vibelist uses Supabase for authentication, database, and storage. The integration is set up using the `@supabase/ssr` package which provides the necessary client implementations for Next.js applications.

## Files

- **client.js**: Browser-side Supabase client for client components
- **server.js**: Server-side Supabase client for server components
- **middleware.js**: Session handling functions for Next.js middleware

## Usage

### In Client Components

```javascript
"use client";

import { createClient } from "@/libs/supabase/client";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  // Rest of component code
}
```

### In Server Components

```javascript
import { createClient } from "@/libs/supabase/server";

export default async function Dashboard() {
  const supabase = createClient();

  // Get session from cookie
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Handle unauthenticated user
    return <div>Please sign in</div>;
  }

  // Get user's waitlists
  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("*")
    .order("created_at", { ascending: false });

  return <div>{/* Display waitlists */}</div>;
}
```

### In Next.js Middleware

```javascript
// middleware.js
import { NextResponse } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
```

## Database Schema

The Supabase database includes the following tables:

1. **profiles** - User profile information
2. **waitlists** - Waitlist data created by users
3. **waitlist_signups** - People who signed up to waitlists
4. **customization_settings** - Customization options for waitlists
5. **waitlist_analytics** - Analytics data for waitlists

For full database schema details, see the SQL migration files in:
`scripts/migrations/*.sql`

## Authentication

Supabase Auth is configured to use email/password authentication. The authentication flow is:

1. User signs up with email/password
2. User signs in with email/password
3. Supabase creates a session and stores it in cookies
4. The middleware refreshes the session on each request

## Row-Level Security (RLS)

Supabase RLS policies ensure that:

- Users can only access their own data
- Users can only see waitlists they created
- Anyone can sign up to a published waitlist

## Environment Variables

The Supabase integration requires the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

These should be set in the `.env.local` file.
