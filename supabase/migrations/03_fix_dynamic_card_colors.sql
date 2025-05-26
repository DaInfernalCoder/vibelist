-- Migration: Fix Dynamic Card Background Colors
-- This migration updates card background colors to be contextually appropriate
-- based on the theme's background color (light themes get light cards, dark themes get dark cards)

-- Function to determine if a color is "light" or "dark" based on luminance
-- This uses a simplified approach checking if the color values suggest a light background
CREATE OR REPLACE FUNCTION is_light_color(hex_color TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    r INTEGER;
    g INTEGER;
    b INTEGER;
    luminance FLOAT;
BEGIN
    -- Remove # if present and ensure we have a valid hex color
    hex_color := REPLACE(UPPER(hex_color), '#', '');
    
    -- Handle 3-digit hex colors by expanding them
    IF LENGTH(hex_color) = 3 THEN
        hex_color := SUBSTRING(hex_color, 1, 1) || SUBSTRING(hex_color, 1, 1) ||
                     SUBSTRING(hex_color, 2, 1) || SUBSTRING(hex_color, 2, 1) ||
                     SUBSTRING(hex_color, 3, 1) || SUBSTRING(hex_color, 3, 1);
    END IF;
    
    -- Extract RGB values
    r := ('x' || SUBSTRING(hex_color, 1, 2))::bit(8)::INTEGER;
    g := ('x' || SUBSTRING(hex_color, 3, 2))::bit(8)::INTEGER;
    b := ('x' || SUBSTRING(hex_color, 5, 2))::bit(8)::INTEGER;
    
    -- Calculate relative luminance (simplified)
    luminance := (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    -- Return true if luminance > 0.5 (light color)
    RETURN luminance > 0.5;
EXCEPTION
    WHEN OTHERS THEN
        -- Default to light if we can't parse the color
        RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get appropriate card background color based on theme background
CREATE OR REPLACE FUNCTION get_contextual_card_color(bg_color TEXT)
RETURNS TEXT AS $$
BEGIN
    -- If background is light, use white or very light card
    IF is_light_color(bg_color) THEN
        RETURN '#ffffff';
    -- If background is dark, use a slightly lighter dark card for contrast
    ELSE
        RETURN '#2a2a2a';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with problematic card background colors
UPDATE customization_settings 
SET 
    custom_fields = jsonb_set(
        custom_fields,
        '{cardBackgroundColor}',
        to_jsonb(get_contextual_card_color(custom_fields->>'bgColor')),
        true
    ),
    updated_at = NOW()
WHERE 
    custom_fields ? 'cardBackgroundColor' 
    AND custom_fields ? 'bgColor'
    -- Only update records where the current card color doesn't match the theme appropriately
    AND (
        (is_light_color(custom_fields->>'bgColor') AND custom_fields->>'cardBackgroundColor' = '#1f1f1f')
        OR 
        (NOT is_light_color(custom_fields->>'bgColor') AND custom_fields->>'cardBackgroundColor' = '#ffffff')
    );

-- Also update card border colors to be more contextually appropriate
UPDATE customization_settings 
SET 
    custom_fields = jsonb_set(
        custom_fields,
        '{cardBorderColor}',
        to_jsonb(
            CASE 
                WHEN is_light_color(custom_fields->>'bgColor') THEN '#e2e8f0'  -- Light gray border for light themes
                ELSE '#4a5568'  -- Medium gray border for dark themes
            END
        ),
        true
    ),
    updated_at = NOW()
WHERE 
    custom_fields ? 'cardBorderColor' 
    AND custom_fields ? 'bgColor'
    -- Only update if current border color is the problematic dark color on light themes
    AND (
        (is_light_color(custom_fields->>'bgColor') AND custom_fields->>'cardBorderColor' = '#444444')
        OR 
        (NOT is_light_color(custom_fields->>'bgColor') AND custom_fields->>'cardBorderColor' = '#e2e8f0')
    );

-- Log the changes made
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Count how many records were updated
    SELECT COUNT(*) INTO updated_count
    FROM customization_settings 
    WHERE 
        custom_fields ? 'cardBackgroundColor' 
        AND custom_fields ? 'bgColor'
        AND updated_at > NOW() - INTERVAL '1 minute';
        
    RAISE NOTICE 'Updated % records with contextual card colors', updated_count;
END $$;

-- Drop the helper functions as they're no longer needed after migration
DROP FUNCTION IF EXISTS is_light_color(TEXT);
DROP FUNCTION IF EXISTS get_contextual_card_color(TEXT); 