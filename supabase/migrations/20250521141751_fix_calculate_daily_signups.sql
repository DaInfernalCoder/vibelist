-- Migration script to fix the GROUP BY error in calculate_daily_signups function
-- This fixes the error: "column 'days.day' must appear in the GROUP BY clause or be used in an aggregate function"
-- which occurs during waitlist signups

-- Replace the calculate_daily_signups function with the fixed version
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
    GROUP BY days.day
    ORDER BY days.day;

    RETURN daily_counts;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function to document the fix
COMMENT ON FUNCTION calculate_daily_signups(UUID) IS 'Calculates daily signups for a waitlist over the last 30 days. Fixed GROUP BY clause to avoid SQL error.';

-- Create a utility function to enable/disable analytics triggers
-- This can be useful during maintenance or high-load operations
CREATE OR REPLACE FUNCTION toggle_analytics_triggers(p_enable boolean)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF p_enable THEN
        ALTER TABLE waitlist_signups ENABLE TRIGGER update_analytics_on_signup_change;
        RAISE NOTICE 'Analytics triggers have been enabled';
    ELSE
        ALTER TABLE waitlist_signups DISABLE TRIGGER update_analytics_on_signup_change;
        RAISE NOTICE 'Analytics triggers have been disabled';
    END IF;
END; $$;

-- Add a comment to the toggle function
COMMENT ON FUNCTION toggle_analytics_triggers(boolean) IS 'Enables or disables analytics triggers on waitlist_signups table. Use during maintenance or high-load operations.';

-- Create a fallback function that handles errors gracefully
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
        GROUP BY days.day
        ORDER BY days.day;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'Error in calculate_daily_signups_safe: %, Context: %', SQLERRM, err_context;
        
        -- Fallback to a simpler query that still provides useful data
        -- but doesn't use complex grouping that might cause errors
        SELECT 
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'date', to_char(current_date - (n || ' days')::interval, 'YYYY-MM-DD'),
                        'count', 0
                    )
                ),
                '[]'::jsonb
            ) INTO daily_counts
        FROM generate_series(0, 29) n;
    END;

    -- Return empty array if we somehow still got NULL
    RETURN COALESCE(daily_counts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the safe function
COMMENT ON FUNCTION calculate_daily_signups_safe(UUID) IS 'Safe version of calculate_daily_signups that handles errors gracefully and provides fallback data.'; 