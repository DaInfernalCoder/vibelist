-- Migration script to set up Row-Level Security (RLS) policies
-- This ensures proper data access control for all tables

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Users can only read/update their own profile
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_policy ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for waitlists table
-- Users can only access their own waitlists
CREATE POLICY waitlists_select_policy ON public.waitlists
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY waitlists_insert_policy ON public.waitlists
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY waitlists_update_policy ON public.waitlists
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY waitlists_delete_policy ON public.waitlists
    FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for waitlist_signups table
-- Users can only access signups for waitlists they own
CREATE POLICY waitlist_signups_select_policy ON public.waitlist_signups
    FOR SELECT USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

-- Anyone can sign up to a waitlist (insert), but only if the waitlist exists
CREATE POLICY waitlist_signups_insert_policy ON public.waitlist_signups
    FOR INSERT WITH CHECK (
        waitlist_id IN (
            SELECT id FROM public.waitlists
        )
    );

-- Only waitlist owners can update signups
CREATE POLICY waitlist_signups_update_policy ON public.waitlist_signups
    FOR UPDATE USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

-- Only waitlist owners can delete signups
CREATE POLICY waitlist_signups_delete_policy ON public.waitlist_signups
    FOR DELETE USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

-- Create policies for customization_settings table
-- Users can only access customization settings for waitlists they own
CREATE POLICY customization_settings_select_policy ON public.customization_settings
    FOR SELECT USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY customization_settings_update_policy ON public.customization_settings
    FOR UPDATE USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

-- Special policy to allow anon users to view published waitlist settings
CREATE POLICY customization_settings_anon_select_policy ON public.customization_settings
    FOR SELECT USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE status = 'published'
        )
    );

-- Add a policy to allow anon users to view published waitlist details
CREATE POLICY waitlists_anon_select_policy ON public.waitlists
    FOR SELECT USING (status = 'published'); 