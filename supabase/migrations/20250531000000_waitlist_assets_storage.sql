-- Create storage bucket for waitlist assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('waitlist-assets', 'waitlist-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow users to select their own assets
CREATE POLICY "Allow users to select their own assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'waitlist-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to insert their own assets
CREATE POLICY "Allow users to insert their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waitlist-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own assets
CREATE POLICY "Allow users to update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'waitlist-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own assets
CREATE POLICY "Allow users to delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'waitlist-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public access to assets in the waitlist-assets bucket
CREATE POLICY "Allow public access to waitlist assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'waitlist-assets');

-- Update the waitlist_templates table to include template_data as JSONB
ALTER TABLE IF EXISTS public.waitlist_templates
ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb; 