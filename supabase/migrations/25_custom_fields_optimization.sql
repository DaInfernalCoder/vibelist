-- Migration for Task 25.1: Database Schema Standardization and Performance Optimization
-- This migration adds performance indexes and helper functions for custom_fields standardization

-- Add GIN index on custom_fields JSONB column for faster queries
-- Using CONCURRENTLY to avoid blocking operations on production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customization_custom_fields_gin
ON public.customization_settings USING gin (custom_fields);

-- Add comment to document the index purpose
COMMENT ON INDEX idx_customization_custom_fields_gin IS 
'GIN index for faster JSONB operations on custom_fields. Added for Task 25.1 performance optimization.';

-- Create helper function for JSON field conversion in PostgreSQL
CREATE OR REPLACE FUNCTION public.convert_snake_to_camel(input_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result jsonb := '{}';
    key text;
    value jsonb;
    camel_key text;
BEGIN
    -- Handle null input
    IF input_json IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Iterate through all key-value pairs
    FOR key, value IN SELECT * FROM jsonb_each(input_json)
    LOOP
        -- Convert snake_case to camelCase
        IF key ~ '_' THEN
            -- Convert snake_case to camelCase using regex replacement
            camel_key := regexp_replace(key, '_([a-z])', '\U\1', 'g');
        ELSE
            camel_key := key;
        END IF;
        
        -- Add to result
        result := result || jsonb_build_object(camel_key, value);
    END LOOP;
    
    RETURN result;
END;
$$;

-- Add comment for the helper function
COMMENT ON FUNCTION public.convert_snake_to_camel(jsonb) IS 
'Converts snake_case keys in JSONB to camelCase. Used for custom_fields standardization in Task 25.1.';

-- Create function to validate custom_fields structure
CREATE OR REPLACE FUNCTION public.validate_custom_fields(input_json jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Handle null input
    IF input_json IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if it's a valid JSON object (not array or primitive)
    IF jsonb_typeof(input_json) != 'object' THEN
        RETURN false;
    END IF;
    
    -- Additional validation rules can be added here
    -- For example, check for maximum size, valid field names, etc.
    
    -- Check maximum size (in bytes) - 1MB limit
    IF length(input_json::text) > 1048576 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Add comment for validation function
COMMENT ON FUNCTION public.validate_custom_fields(jsonb) IS 
'Validates custom_fields JSONB structure and constraints. Used for data integrity in Task 25.1.';

-- Create function to get field naming convention statistics
CREATE OR REPLACE FUNCTION public.analyze_custom_fields_conventions()
RETURNS TABLE (
    convention_type text,
    field_count bigint,
    example_fields text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH field_analysis AS (
        SELECT 
            key,
            CASE 
                WHEN key ~ '_' THEN 'snake_case'
                WHEN key ~ '[A-Z]' THEN 'camelCase'
                ELSE 'lowercase'
            END as convention
        FROM public.customization_settings,
             jsonb_each_text(custom_fields)
        WHERE custom_fields IS NOT NULL
    ),
    aggregated AS (
        SELECT 
            convention,
            count(*) as field_count,
            array_agg(DISTINCT key ORDER BY key LIMIT 5) as examples
        FROM field_analysis
        GROUP BY convention
    )
    SELECT 
        aggregated.convention,
        aggregated.field_count,
        aggregated.examples
    FROM aggregated
    ORDER BY aggregated.field_count DESC;
END;
$$;

-- Add comment for analysis function
COMMENT ON FUNCTION public.analyze_custom_fields_conventions() IS 
'Analyzes naming conventions in custom_fields across all waitlists. Used for migration planning in Task 25.1.';

-- Create trigger function to automatically validate custom_fields on insert/update
CREATE OR REPLACE FUNCTION public.validate_custom_fields_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate custom_fields if it's being set
    IF NEW.custom_fields IS NOT NULL THEN
        IF NOT public.validate_custom_fields(NEW.custom_fields) THEN
            RAISE EXCEPTION 'Invalid custom_fields structure. Must be a valid JSON object under 1MB.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger (but don't enable it yet to avoid disruption during migration)
-- This can be enabled after migration is complete
CREATE TRIGGER validate_custom_fields_on_change
    BEFORE INSERT OR UPDATE ON public.customization_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_custom_fields_trigger();

-- Disable the trigger initially
ALTER TABLE public.customization_settings DISABLE TRIGGER validate_custom_fields_on_change;

-- Add comment for the trigger
COMMENT ON TRIGGER validate_custom_fields_on_change ON public.customization_settings IS 
'Validates custom_fields on insert/update. Disabled by default during Task 25.1 migration.';

-- Create function to enable/disable validation trigger
CREATE OR REPLACE FUNCTION public.toggle_custom_fields_validation(enable_validation boolean)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF enable_validation THEN
        ALTER TABLE public.customization_settings ENABLE TRIGGER validate_custom_fields_on_change;
        RAISE NOTICE 'Custom fields validation enabled';
    ELSE
        ALTER TABLE public.customization_settings DISABLE TRIGGER validate_custom_fields_on_change;
        RAISE NOTICE 'Custom fields validation disabled';
    END IF;
END;
$$;

-- Add comment for toggle function
COMMENT ON FUNCTION public.toggle_custom_fields_validation(boolean) IS 
'Enables or disables custom_fields validation trigger. Used during Task 25.1 migration.';

-- Add migration metadata
INSERT INTO public.migration_logs (
    migration_name,
    applied_at,
    description
) VALUES (
    '25_custom_fields_optimization',
    NOW(),
    'Added GIN indexes and helper functions for custom_fields standardization (Task 25.1)'
) ON CONFLICT (migration_name) DO NOTHING;

-- Create migration_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_logs (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    description TEXT,
    rollback_instructions TEXT
);

-- Add RLS policy for migration_logs (admin only)
ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY migration_logs_admin_only ON public.migration_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Performance monitoring queries for migration
-- These can be used to monitor the impact of the migration

-- Query to check index usage
CREATE OR REPLACE VIEW public.custom_fields_index_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname = 'idx_customization_custom_fields_gin';

-- Query to analyze custom_fields size distribution
CREATE OR REPLACE VIEW public.custom_fields_size_analysis AS
SELECT 
    length(custom_fields::text) as size_bytes,
    count(*) as count_waitlists
FROM public.customization_settings 
WHERE custom_fields IS NOT NULL
GROUP BY length(custom_fields::text)
ORDER BY size_bytes DESC;

-- Add comments for monitoring views
COMMENT ON VIEW public.custom_fields_index_stats IS 
'Monitors usage statistics for the custom_fields GIN index. Used for Task 25.1 performance tracking.';

COMMENT ON VIEW public.custom_fields_size_analysis IS 
'Analyzes the size distribution of custom_fields JSONB objects. Used for Task 25.1 optimization.';

-- Grant necessary permissions for migration scripts
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.customization_settings TO service_role;
GRANT EXECUTE ON FUNCTION public.convert_snake_to_camel(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_custom_fields(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.analyze_custom_fields_conventions() TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_custom_fields_validation(boolean) TO service_role; 