-- 005_storage_avatars_policy.sql
-- Configure avatars storage bucket and row-level security (RLS) policies

-- 1. Ensure 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Enable public read access for avatars
DROP POLICY IF EXISTS "Public Read Access on Avatars" ON storage.objects;
CREATE POLICY "Public Read Access on Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Enable authenticated & anon user uploads to avatars
DROP POLICY IF EXISTS "Allow Uploads to Avatars" ON storage.objects;
CREATE POLICY "Allow Uploads to Avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- 4. Enable updates and replacements in avatars
DROP POLICY IF EXISTS "Allow Updates to Avatars" ON storage.objects;
CREATE POLICY "Allow Updates to Avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 5. Enable deletion in avatars
DROP POLICY IF EXISTS "Allow Deletes from Avatars" ON storage.objects;
CREATE POLICY "Allow Deletes from Avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
