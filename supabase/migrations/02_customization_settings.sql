-- Migration script to create Customization_Settings table
-- This table stores the customization options for each waitlist

-- Create Customization_Settings table
CREATE TABLE IF NOT EXISTS public.customization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waitlist_id UUID NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
    theme_color TEXT DEFAULT '#3B82F6', -- Default to a blue color
    logo_url TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    redirect_url TEXT,
    email_template TEXT,
    show_social_proof BOOLEAN DEFAULT TRUE,
    show_referral BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(waitlist_id) -- One customization setting per waitlist
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customization_settings_waitlist_id ON public.customization_settings(waitlist_id);

-- Create trigger to update the updated_at column
CREATE TRIGGER update_customization_settings_updated_at
BEFORE UPDATE ON public.customization_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a trigger to automatically create customization settings when a new waitlist is created
CREATE OR REPLACE FUNCTION create_default_customization_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customization_settings (waitlist_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_customization_settings_on_waitlist_insert
AFTER INSERT ON public.waitlists
FOR EACH ROW EXECUTE FUNCTION create_default_customization_settings(); 