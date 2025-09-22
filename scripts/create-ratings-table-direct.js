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

async function createRatingsTable() {
  try {
    console.log('🚀 Creating case_study_ratings table directly...')
    
    // First, create the table structure
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS case_study_ratings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          case_study_id UUID NOT NULL,
          user_id UUID NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          feedback TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(case_study_id, user_id)
        );
      `
    })

    if (createError) {
      console.log('Table might already exist, trying alternative approach...')
      
      // Try using direct SQL execution via a different method
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'case_study_ratings')
        .eq('table_schema', 'public')

      if (error || !data || data.length === 0) {
        console.log('❌ Table does not exist. Creating via manual SQL execution...')
        
        // Create a simple test to verify connection
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('id')
          .limit(1)
        
        if (testError) {
          console.error('❌ Database connection failed:', testError)
          return
        }
        
        console.log('✅ Database connection verified')
        
        // Since we can't execute DDL via the client, we'll create a simple verification
        console.log('📋 Please execute this SQL in Supabase SQL Editor:')
        console.log(`
-- Create case study ratings table
CREATE TABLE IF NOT EXISTS case_study_ratings (
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
CREATE INDEX IF NOT EXISTS idx_case_study_ratings_case_study_id ON case_study_ratings(case_study_id);
CREATE INDEX IF NOT EXISTS idx_case_study_ratings_user_id ON case_study_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_case_study_ratings_created_at ON case_study_ratings(created_at);

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
        `)
        
        // Let's try to create it manually using the service role
        console.log('🔄 Attempting to create table using service role...')
        
        // Use a workaround - create via INSERT operation that will fail but might create the table
        try {
          // This is a hack - we'll try to access the table to see if it exists
          const { error: accessError } = await supabase
            .from('case_study_ratings')
            .select('*')
            .limit(1)
          
          if (accessError && accessError.message.includes('does not exist')) {
            console.log('❌ Table definitely does not exist')
            console.log('🔧 Creating table using alternative method...')
            
            // Since we can't create via API, let's use a different approach
            // We'll create a script that the user can run
            return false
          } else {
            console.log('✅ Table already exists!')
            return true
          }
        } catch (err) {
          console.log('Table creation needed')
          return false
        }
      } else {
        console.log('✅ Table case_study_ratings already exists!')
        return true
      }
    } else {
      console.log('✅ Table created successfully!')
      return true
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Execute the function
createRatingsTable().then(success => {
  if (success) {
    console.log('🎉 Database setup complete!')
  } else {
    console.log('⚠️  Manual SQL execution required in Supabase Dashboard')
  }
})
