# Database Schema Documentation

This directory contains SQL migration files that define the database schema for the Vibelist application.

## Schema Overview

The database schema consists of the following tables:

1. **profiles** - Extends the default Supabase auth.users table with additional profile information.
2. **waitlists** - Stores information about waitlists created by users.
3. **waitlist_signups** - Tracks people who sign up to waitlists.
4. **customization_settings** - Stores customization options for each waitlist.
5. **waitlist_analytics** - Caches analytics data for waitlists.

## Table Relationships

- Each **user** can have multiple **waitlists** (one-to-many)
- Each **waitlist** can have multiple **signups** (one-to-many)
- Each **waitlist** has one **customization_setting** (one-to-one)
- Each **waitlist** has one **waitlist_analytics** entry (one-to-one)

## Row-Level Security (RLS)

The schema implements Row-Level Security to ensure:

- Users can only access their own profile data
- Users can only see and manage their own waitlists
- Users can only see signups for waitlists they own
- Anonymous users can view published waitlists but can't see internal data

## How to Apply Migrations

These migrations should be applied in numerical order. You can apply them in the Supabase dashboard or using the Supabase CLI.

### Using Supabase Dashboard

1. Log in to the [Supabase Dashboard](https://app.supabase.io)
2. Navigate to your project
3. Go to the SQL Editor
4. Copy and paste the content of each migration file (in order)
5. Execute each script

### Using Supabase CLI

If you have the Supabase CLI installed, you can apply migrations using:

```bash
supabase db push
```

### Using the Provided Scripts

Two Node.js scripts are included to help apply migrations:

1. **apply_migrations.js** - Uses RPC to apply migrations (requires creating a custom function):

   ```bash
   # Install dependencies if needed
   npm install dotenv @supabase/supabase-js

   # Apply migrations
   node scripts/migrations/apply_migrations.js
   ```

2. **apply_migrations_direct.js** - Directly executes SQL (preferred method):

   ```bash
   # Install dependencies if needed
   npm install dotenv @supabase/supabase-js

   # Apply migrations
   node scripts/migrations/apply_migrations_direct.js
   ```

## Migration Files

1. **01_core_tables.sql** - Creates the core tables (profiles, waitlists, waitlist_signups)
2. **02_customization_settings.sql** - Creates the customization_settings table and related triggers
3. **03_row_level_security.sql** - Implements Row-Level Security policies
4. **04_analytics_functions.sql** - Creates analytics functions, triggers, and the waitlist_analytics table

## Notes

- All tables have `created_at` and `updated_at` timestamps
- The `updated_at` columns are automatically updated via triggers
- Foreign key constraints ensure referential integrity
- Indexes are created on frequently queried columns for performance
- Custom PostgreSQL functions provide analytics capabilities
- We use UUID as the primary key type for all tables

## Testing the Schema

### Automated Testing

A test script is provided to automatically verify the schema:

```bash
# Install dependencies if needed
npm install dotenv @supabase/supabase-js

# Run the test script
node scripts/migrations/test_schema.js
```

The script tests:

1. If all tables exist
2. Creating a test user
3. Creating a waitlist
4. Verifying customization settings are automatically created
5. Adding a waitlist signup
6. Testing the analytics functions

### Manual Testing

You can also test the schema manually by:

1. Creating a test user through Supabase auth
2. Creating a waitlist for the user
3. Verifying that customization settings are automatically created
4. Adding signups to the waitlist
5. Testing the analytics functions
6. Verifying RLS policies by logging in as different users
