-- Migration script to create core tables
-- This includes Users, Waitlists, and Waitlist_Signups tables with proper relationships

-- Create Users table (note: auth.users is already created by Supabase Auth)
-- This table extends the default auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create waitlists table
CREATE TABLE IF NOT EXISTS public.waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create waitlist_signups table
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waitlist_id UUID NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    signup_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected, etc.
    referral_code TEXT,
    referral_source TEXT,
    UNIQUE(waitlist_id, email) -- Prevent duplicate signups with the same email
);

-- Add appropriate indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_waitlists_owner_id ON public.waitlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_waitlist_id ON public.waitlist_signups(waitlist_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON public.waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlists_created_at ON public.waitlists(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_signup_time ON public.waitlist_signups(signup_time);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlists_updated_at
BEFORE UPDATE ON public.waitlists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get waitlist signups count
CREATE OR REPLACE FUNCTION get_waitlist_signup_count(p_waitlist_id UUID)
RETURNS INTEGER AS $$
DECLARE
    signup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO signup_count
    FROM public.waitlist_signups
    WHERE waitlist_id = p_waitlist_id;
    
    RETURN signup_count;
END;
$$ LANGUAGE plpgsql; 