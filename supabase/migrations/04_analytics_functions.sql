-- Migration script to create advanced analytics functions and triggers
-- This includes functions for waitlist statistics, signup tracking, and analytics

-- Create a table to store cached analytics data
CREATE TABLE IF NOT EXISTS public.waitlist_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waitlist_id UUID NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
    total_signups INTEGER DEFAULT 0,
    daily_signups JSONB DEFAULT '[]'::jsonb,
    referral_sources JSONB DEFAULT '{}'::jsonb,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(waitlist_id)
);

-- Enable RLS on analytics table
ALTER TABLE public.waitlist_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for waitlist_analytics table
CREATE POLICY waitlist_analytics_select_policy ON public.waitlist_analytics
    FOR SELECT USING (
        waitlist_id IN (
            SELECT id FROM public.waitlists 
            WHERE owner_id = auth.uid()
        )
    );

-- Function to calculate daily signups for the last 30 days
CREATE OR REPLACE FUNCTION calculate_daily_signups(p_waitlist_id UUID)
RETURNS JSONB AS $$
DECLARE
    daily_counts JSONB;
BEGIN
    WITH days AS (
        SELECT generate_series(
            date_trunc('day', now()) - interval '29 days',
            date_trunc('day', now()),
            interval '1 day'
        ) AS day
    ),
    signups AS (
        SELECT 
            date_trunc('day', signup_time) AS day,
            COUNT(*) AS count
        FROM public.waitlist_signups
        WHERE 
            waitlist_id = p_waitlist_id AND
            signup_time >= (now() - interval '30 days')
        GROUP BY 1
    )
    SELECT 
        json_agg(
            json_build_object(
                'date', to_char(days.day, 'YYYY-MM-DD'),
                'count', COALESCE(signups.count, 0)
            )
        ) INTO daily_counts
    FROM days
    LEFT JOIN signups ON days.day = signups.day
    ORDER BY days.day;

    RETURN daily_counts;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate referral sources
CREATE OR REPLACE FUNCTION calculate_referral_sources(p_waitlist_id UUID)
RETURNS JSONB AS $$
DECLARE
    referral_data JSONB;
BEGIN
    SELECT 
        jsonb_object_agg(
            COALESCE(referral_source, 'direct'),
            count(*)
        ) INTO referral_data
    FROM public.waitlist_signups
    WHERE waitlist_id = p_waitlist_id
    GROUP BY referral_source;

    RETURN COALESCE(referral_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to update waitlist analytics
CREATE OR REPLACE FUNCTION update_waitlist_analytics(p_waitlist_id UUID)
RETURNS VOID AS $$
DECLARE
    total_count INTEGER;
    daily_data JSONB;
    referral_data JSONB;
BEGIN
    -- Calculate total signups
    SELECT COUNT(*) INTO total_count
    FROM public.waitlist_signups
    WHERE waitlist_id = p_waitlist_id;
    
    -- Calculate daily signups
    daily_data := calculate_daily_signups(p_waitlist_id);
    
    -- Calculate referral sources
    referral_data := calculate_referral_sources(p_waitlist_id);
    
    -- Update or insert analytics
    INSERT INTO public.waitlist_analytics
        (waitlist_id, total_signups, daily_signups, referral_sources, last_calculated)
    VALUES
        (p_waitlist_id, total_count, daily_data, referral_data, NOW())
    ON CONFLICT (waitlist_id)
    DO UPDATE SET
        total_signups = total_count,
        daily_signups = daily_data,
        referral_sources = referral_data,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update analytics when signups change
CREATE OR REPLACE FUNCTION trigger_update_waitlist_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule the analytics update (using pg_background if available)
    PERFORM update_waitlist_analytics(
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.waitlist_id
            ELSE NEW.waitlist_id
        END
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waitlist_signups
CREATE TRIGGER update_analytics_on_signup_change
AFTER INSERT OR UPDATE OR DELETE ON public.waitlist_signups
FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_waitlist_analytics();

-- Function to get analytics for a specific waitlist
CREATE OR REPLACE FUNCTION get_waitlist_analytics(p_waitlist_id UUID)
RETURNS TABLE (
    total_signups INTEGER,
    daily_signups JSONB,
    referral_sources JSONB,
    last_calculated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- First, ensure analytics are up-to-date
    PERFORM update_waitlist_analytics(p_waitlist_id);
    
    -- Return the analytics data
    RETURN QUERY
    SELECT 
        wa.total_signups,
        wa.daily_signups,
        wa.referral_sources,
        wa.last_calculated
    FROM public.waitlist_analytics wa
    WHERE wa.waitlist_id = p_waitlist_id;
END;
$$ LANGUAGE plpgsql; 