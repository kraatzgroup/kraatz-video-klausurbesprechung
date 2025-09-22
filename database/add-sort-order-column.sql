-- Add sort_order column to video_lessons table for manual ordering
ALTER TABLE video_lessons 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_video_lessons_sort_order ON video_lessons(sort_order);

-- Update existing videos with initial sort order based on creation date
UPDATE video_lessons 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC) 
  FROM (SELECT id, created_at FROM video_lessons ORDER BY created_at ASC) AS ordered_videos 
  WHERE ordered_videos.id = video_lessons.id
)
WHERE sort_order = 0;
