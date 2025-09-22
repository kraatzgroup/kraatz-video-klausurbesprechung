-- Update storage bucket configuration to allow larger video files
-- This script increases the file size limit for the video-lessons bucket

-- Update the video-lessons bucket to allow larger files (up to 5GB)
UPDATE storage.buckets 
SET file_size_limit = 5368709120  -- 5GB in bytes
WHERE id = 'video-lessons';

-- If the bucket doesn't exist, create it with the larger limit
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('video-lessons', 'video-lessons', true, 5368709120)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5368709120,
  public = true;

-- Verify the update
SELECT id, name, public, file_size_limit, 
       ROUND(file_size_limit / 1024.0 / 1024.0 / 1024.0, 2) as size_limit_gb
FROM storage.buckets 
WHERE id = 'video-lessons';
