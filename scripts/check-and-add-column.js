const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndAddColumn() {
  try {
    console.log('Checking existing columns in case_study_requests table...');
    
    // Get one record to see all available columns
    const { data: sampleData, error: sampleError } = await supabase
      .from('case_study_requests')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('Available columns:', Object.keys(sampleData[0]));
      
      if (sampleData[0].hasOwnProperty('scoring_schema_url')) {
        console.log('✅ scoring_schema_url column already exists!');
        return;
      }
      
      if (sampleData[0].hasOwnProperty('scoring_sheet_url')) {
        console.log('Found scoring_sheet_url column. We need to add scoring_schema_url.');
      }
    }
    
    console.log('❌ scoring_schema_url column does not exist.');
    console.log('\n📋 To add the column, please:');
    console.log('1. Go to https://supabase.com/dashboard/project/rpgbyockvpannrupicno');
    console.log('2. Navigate to Table Editor > case_study_requests');
    console.log('3. Click "Add Column" button');
    console.log('4. Column name: scoring_schema_url');
    console.log('5. Type: text');
    console.log('6. Nullable: ✅ (checked)');
    console.log('7. Click "Save"');
    
    console.log('\n🔧 Or run this SQL in the SQL Editor:');
    console.log('ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
checkAndAddColumn();
