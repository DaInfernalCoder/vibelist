-- Create a function to generate a slug from a name
CREATE OR REPLACE FUNCTION generate_slug_from_name(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Convert name to lowercase, replace spaces with hyphens, and remove special characters
  v_base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9\s]', '', 'g'));
  v_base_slug := regexp_replace(v_base_slug, '\s+', '-', 'g');
  
  -- Limit slug length to 50 characters
  IF length(v_base_slug) > 50 THEN
    v_base_slug := substring(v_base_slug, 1, 50);
  END IF;
  
  -- Start with the base slug
  v_slug := v_base_slug;
  
  -- Check if slug exists and append a number if needed
  WHILE EXISTS (SELECT 1 FROM public.waitlists WHERE url_slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_slug;
END;
$$;

-- Create a function to ensure a unique slug
CREATE OR REPLACE FUNCTION ensure_unique_slug(p_base_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Start with the base slug
  v_slug := p_base_slug;
  
  -- Check if slug exists and append a number if needed
  WHILE EXISTS (SELECT 1 FROM public.waitlists WHERE url_slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := p_base_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_slug;
END;
$$;

-- Create a trigger to automatically generate a slug if one is not provided
CREATE OR REPLACE FUNCTION generate_waitlist_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate a slug if one is not provided
  IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
    NEW.url_slug := generate_slug_from_name(NEW.name);
  ELSE
    -- Ensure the provided slug is unique
    NEW.url_slug := ensure_unique_slug(NEW.url_slug);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS waitlist_slug_trigger ON public.waitlists;

-- Create the trigger
CREATE TRIGGER waitlist_slug_trigger
BEFORE INSERT ON public.waitlists
FOR EACH ROW
EXECUTE FUNCTION generate_waitlist_slug(); 