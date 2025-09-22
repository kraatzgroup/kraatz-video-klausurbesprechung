-- Create video_progress table to track user video viewing status
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_lesson_id UUID NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one progress record per user per video
  UNIQUE(user_id, video_lesson_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_lesson_id ON video_progress(video_lesson_id);

-- Enable RLS
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own progress
CREATE POLICY "Users can view own video progress" ON video_progress
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own progress
CREATE POLICY "Users can insert own video progress" ON video_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own progress
CREATE POLICY "Users can update own video progress" ON video_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_progress_updated_at 
  BEFORE UPDATE ON video_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
