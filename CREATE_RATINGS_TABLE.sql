-- Execute this SQL in Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno/sql

CREATE TABLE case_study_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES case_study_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_study_id, user_id)
);

CREATE INDEX idx_case_study_ratings_case_study_id ON case_study_ratings(case_study_id);
CREATE INDEX idx_case_study_ratings_user_id ON case_study_ratings(user_id);

ALTER TABLE case_study_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own ratings" ON case_study_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own ratings" ON case_study_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own ratings" ON case_study_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings" ON case_study_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_case_study_ratings_updated_at 
  BEFORE UPDATE ON case_study_ratings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
