const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyAndCreateTable() {
  try {
    console.log('🔍 Checking if case_study_ratings table exists...')
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return
    }
    
    console.log('📋 Available tables:', tables.map(t => t.table_name))
    
    const ratingsTableExists = tables.some(t => t.table_name === 'case_study_ratings')
    
    if (!ratingsTableExists) {
      console.log('❌ case_study_ratings table does not exist')
      console.log('🔧 Creating table now...')
      
      // Execute the SQL directly using a workaround
      // Since we can't use DDL via the REST API, we'll need to use the SQL editor
      console.log(`
🚨 MANUAL ACTION REQUIRED:
Please go to your Supabase Dashboard and execute this SQL in the SQL Editor:

-- Create case study ratings table
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

-- Create indexes
CREATE INDEX idx_case_study_ratings_case_study_id ON case_study_ratings(case_study_id);
CREATE INDEX idx_case_study_ratings_user_id ON case_study_ratings(user_id);
CREATE INDEX idx_case_study_ratings_created_at ON case_study_ratings(created_at);

-- Enable RLS
ALTER TABLE case_study_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add updated_at trigger
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

Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left menu
4. Paste the SQL above
5. Click "Run"
      `)
      
    } else {
      console.log('✅ case_study_ratings table exists!')
      
      // Test if we can access it
      const { data, error } = await supabase
        .from('case_study_ratings')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Cannot access case_study_ratings table:', error)
        
        if (error.message.includes('schema cache')) {
          console.log('🔄 This might be a schema cache issue. The table exists but Supabase needs to refresh.')
          console.log('💡 Try refreshing your browser or waiting a few minutes.')
        }
      } else {
        console.log('✅ Table is accessible and working!')
        console.log('📊 Current ratings count:', data.length)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

verifyAndCreateTable()
