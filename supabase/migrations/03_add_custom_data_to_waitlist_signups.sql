-- Migration script to add custom_data and UTM tracking fields to waitlist_signups table
-- Created for subtask 8 of task 21: Implement Dynamic Form Generation for Waitlist Signup

-- Add custom_data column to waitlist_signups table
ALTER TABLE IF EXISTS public.waitlist_signups 
ADD COLUMN IF NOT EXISTS custom_data JSONB;

-- Add UTM tracking columns if they don't already exist
ALTER TABLE IF EXISTS public.waitlist_signups
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Create index on email for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON public.waitlist_signups(email);

-- Create index on waitlist_id and email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_waitlist_email ON public.waitlist_signups(waitlist_id, email); 