
-- Add new columns to client_intake_forms
ALTER TABLE public.client_intake_forms
  ADD COLUMN IF NOT EXISTS product_description text,
  ADD COLUMN IF NOT EXISTS offers_description text,
  ADD COLUMN IF NOT EXISTS existing_website text,
  ADD COLUMN IF NOT EXISTS ideal_customer text,
  ADD COLUMN IF NOT EXISTS competitors text,
  ADD COLUMN IF NOT EXISTS positioning text,
  ADD COLUMN IF NOT EXISTS desired_pages jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_colors text,
  ADD COLUMN IF NOT EXISTS visual_style text,
  ADD COLUMN IF NOT EXISTS brand_tone text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS brand_guide_url text;

-- Create client-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-assets', 'client-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read client-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-assets');

-- Public insert access (clients submit without auth)
CREATE POLICY "Public insert client-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-assets');
