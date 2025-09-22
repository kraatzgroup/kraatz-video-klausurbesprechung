const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTableManually() {
  console.log('🚀 Creating case_study_ratings table manually...')
  
  try {
    // Create the table by making a direct SQL call using a stored procedure approach
    // First, let's try to create a simple test record to see if table exists
    const { data: testData, error: testError } = await supabase
      .from('case_study_ratings')
      .select('id')
      .limit(1)
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ Table does not exist. Manual creation required.')
      
      // Since we can't create DDL via REST API, we need to use the dashboard
      console.log(`
🔧 REQUIRED: Execute this SQL in Supabase Dashboard SQL Editor:

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

🔗 Go to: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql
      `)
      
      return false
    } else if (testError) {
      console.error('❌ Other error:', testError)
      return false
    } else {
      console.log('✅ Table already exists and is accessible!')
      return true
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

createTableManually().then(success => {
  if (success) {
    console.log('🎉 Table is ready!')
  } else {
    console.log('⚠️ Manual SQL execution required')
  }
})
