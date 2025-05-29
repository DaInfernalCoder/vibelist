-- Migration script to add payment-related fields to profiles table
-- This supports Stripe customer tracking and subscription management

-- Add payment-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS price_id TEXT,
ADD COLUMN IF NOT EXISTS has_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_has_access ON public.profiles(has_access);
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires_at ON public.profiles(access_expires_at);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.profiles.price_id IS 'Stripe price ID for the selected subscription plan';
COMMENT ON COLUMN public.profiles.has_access IS 'Boolean flag indicating if user has paid access to premium features';
COMMENT ON COLUMN public.profiles.access_expires_at IS 'Timestamp when access expires (null for lifetime plans)';

-- Create a function to check if user has valid subscription
CREATE OR REPLACE FUNCTION has_valid_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT has_access, access_expires_at INTO user_record
    FROM public.profiles
    WHERE id = user_id;
    
    -- If user doesn't have access, return false
    IF NOT user_record.has_access THEN
        RETURN FALSE;
    END IF;
    
    -- If access_expires_at is null, it's lifetime access
    IF user_record.access_expires_at IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if subscription hasn't expired
    RETURN user_record.access_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get subscription details
CREATE OR REPLACE FUNCTION get_subscription_details(user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    SELECT has_access, access_expires_at, price_id INTO user_record
    FROM public.profiles
    WHERE id = user_id;
    
    -- If user doesn't have access
    IF NOT user_record.has_access THEN
        result := json_build_object(
            'type', 'none',
            'status', 'inactive',
            'expires_at', null
        );
        RETURN result;
    END IF;
    
    -- Determine plan type and status
    IF user_record.access_expires_at IS NULL THEN
        -- Lifetime access (Hacker plan)
        result := json_build_object(
            'type', 'hacker',
            'status', 'active',
            'expires_at', null
        );
    ELSE
        -- Pro plan with expiration
        IF user_record.access_expires_at > NOW() THEN
            result := json_build_object(
                'type', 'pro',
                'status', 'active',
                'expires_at', user_record.access_expires_at
            );
        ELSE
            result := json_build_object(
                'type', 'pro',
                'status', 'expired',
                'expires_at', user_record.access_expires_at
            );
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get remaining days for Pro plan users
CREATE OR REPLACE FUNCTION get_remaining_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    days_remaining INTEGER;
BEGIN
    SELECT access_expires_at INTO user_record
    FROM public.profiles
    WHERE id = user_id;
    
    -- If no expiration date (lifetime access), return null
    IF user_record.access_expires_at IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate remaining days
    days_remaining := EXTRACT(DAY FROM (user_record.access_expires_at - NOW()));
    
    -- Return 0 if expired
    IF days_remaining < 0 THEN
        RETURN 0;
    END IF;
    
    RETURN days_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 