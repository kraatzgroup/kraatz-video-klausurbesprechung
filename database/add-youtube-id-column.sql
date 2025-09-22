-- Add youtube_id column to video_lessons table for YouTube integration
ALTER TABLE video_lessons 
ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(255);

-- Update existing records to extract YouTube ID from video_url if it's a YouTube embed
UPDATE video_lessons 
SET youtube_id = SUBSTRING(video_url FROM 'youtube\.com/embed/([a-zA-Z0-9_-]+)')
WHERE video_url LIKE '%youtube.com/embed/%' AND youtube_id IS NULL;
