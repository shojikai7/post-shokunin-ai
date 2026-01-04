-- ========================================
-- Storage Buckets Configuration
-- ========================================

-- Note: This SQL is for documentation purposes.
-- Storage buckets should be created via Supabase Dashboard or CLI.

-- Brand Assets Bucket
-- Name: brand-assets
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/*, font/*

-- Generated Media Bucket
-- Name: generated-media
-- Public: true (for SNS posting)
-- File size limit: 20MB
-- Allowed MIME types: image/png, image/jpeg, image/webp

-- ========================================
-- Storage Policies (to be applied via Dashboard)
-- ========================================

-- Brand Assets Policies:
-- SELECT: Users can view their own assets
-- INSERT: Users can upload to their own profile folder
-- DELETE: Users can delete their own assets

-- Generated Media Policies:
-- SELECT: Public read access (for SNS APIs to fetch)
-- INSERT: Only authenticated users via server
-- DELETE: Service role only (for cleanup jobs)

-- Example folder structure:
-- brand-assets/
--   {user_id}/
--     {profile_id}/
--       logo/
--       product_photos/
--       store_photos/
--
-- generated-media/
--   {user_id}/
--     {variant_id}/
--       preview.png
--       final.png

