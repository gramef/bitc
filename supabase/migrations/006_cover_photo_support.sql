-- 006_cover_photo_support.sql
-- Add cover_url column to profiles table and configure policies for cover photos

-- 1. Add cover_url column to profiles if it does not already exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

COMMENT ON COLUMN profiles.cover_url IS 'Custom cover banner photo URL or data URI for profile headers';

-- 2. Ensure users can update their own cover_url
-- (Handled by existing profiles UPDATE RLS policy)
