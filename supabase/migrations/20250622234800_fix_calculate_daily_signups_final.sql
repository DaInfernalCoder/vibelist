-- Final fix for calculate_daily_signups function
-- Remove the incorrect GROUP BY clause that causes SQL errors

-- Replace the calculate_daily_signups function with the correct version
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
        GROUP BY date_trunc('day', signup_time)
    )
    SELECT 
        json_agg(
            json_build_object(
                'date', to_char(days.day, 'YYYY-MM-DD'),
                'count', COALESCE(signups.count, 0)
            )
            ORDER BY days.day
        ) INTO daily_counts
    FROM days
    LEFT JOIN signups ON days.day = signups.day;

    RETURN COALESCE(daily_counts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Also update the safe version with the same fix
CREATE OR REPLACE FUNCTION calculate_daily_signups_safe(p_waitlist_id UUID)
RETURNS JSONB AS $$
DECLARE
    daily_counts JSONB;
    err_context TEXT;
BEGIN
    -- Attempt primary calculation method
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
            GROUP BY date_trunc('day', signup_time)
        )
        SELECT 
            json_agg(
                json_build_object(
                    'date', to_char(days.day, 'YYYY-MM-DD'),
                    'count', COALESCE(signups.count, 0)
                )
                ORDER BY days.day
            ) INTO daily_counts
        FROM days
        LEFT JOIN signups ON days.day = signups.day;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'Error in calculate_daily_signups_safe: %, Context: %', SQLERRM, err_context;
        
        -- Fallback to a simpler query that still provides useful data
        SELECT 
            COALESCE(
                json_agg(
                    json_build_object(
                        'date', to_char(current_date - (n || ' days')::interval, 'YYYY-MM-DD'),
                        'count', 0
                    )
                    ORDER BY n DESC
                ),
                '[]'::jsonb
            ) INTO daily_counts
        FROM generate_series(0, 29) n;
    END;

    -- Return empty array if we somehow still got NULL
    RETURN COALESCE(daily_counts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add a new trigger function that handles errors gracefully
CREATE OR REPLACE FUNCTION trigger_update_waitlist_analytics_safe()
RETURNS TRIGGER AS $$
BEGIN
    -- Wrap analytics update in error handling
    BEGIN
        PERFORM update_waitlist_analytics(
            CASE
                WHEN TG_OP = 'DELETE' THEN OLD.waitlist_id
                ELSE NEW.waitlist_id
            END
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the main operation
        RAISE WARNING 'Analytics update failed during %: %', TG_OP, SQLERRM;
    END;
    
    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger and create a new safe one
DROP TRIGGER IF EXISTS update_analytics_on_signup_change ON public.waitlist_signups;

-- Create safe trigger for waitlist_signups
CREATE TRIGGER update_analytics_on_signup_change_safe
AFTER INSERT OR UPDATE OR DELETE ON public.waitlist_signups
FOR EACH ROW EXECUTE FUNCTION trigger_update_waitlist_analytics_safe();

-- Comments
COMMENT ON FUNCTION calculate_daily_signups(UUID) IS 'Calculates daily signups for a waitlist over the last 30 days. Fixed to remove problematic GROUP BY clause.';
COMMENT ON FUNCTION calculate_daily_signups_safe(UUID) IS 'Safe version of calculate_daily_signups that handles errors gracefully and provides fallback data.';
COMMENT ON FUNCTION trigger_update_waitlist_analytics_safe() IS 'Safe trigger function that handles analytics update errors gracefully without failing the main signup operation.';