-- Add photo support for inventory materials

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN materials.photo_url IS 'Public URL of the material photo in storage';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'material-photos',
  'material-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read material photos" ON storage.objects;
CREATE POLICY "Allow public read material photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public upload material photos" ON storage.objects;
CREATE POLICY "Allow public upload material photos"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public update material photos" ON storage.objects;
CREATE POLICY "Allow public update material photos"
  ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'material-photos')
  WITH CHECK (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public delete material photos" ON storage.objects;
CREATE POLICY "Allow public delete material photos"
  ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'material-photos');
