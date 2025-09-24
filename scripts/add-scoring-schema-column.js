require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addScoringSchemaColumn() {
  try {
    console.log('Adding scoring_schema_url column to case_study_requests table...');
    
    // First check if column exists
    const { data: checkData, error: checkError } = await supabase
      .from('case_study_requests')
      .select('scoring_schema_url')
      .limit(1);
      
    if (!checkError) {
      console.log('Column scoring_schema_url already exists!');
      return;
    }
    
    if (checkError && !checkError.message.includes('column "scoring_schema_url" does not exist')) {
      console.error('Unexpected error checking column:', checkError);
      return;
    }
    
    console.log('Column does not exist, adding it...');
    
    // Use SQL query to add the column
    const { data, error } = await supabase
      .from('case_study_requests')
      .select('*')
      .limit(0); // This will fail but we can use it to execute raw SQL
      
    // Since we can't execute raw SQL directly, we need to add the column manually
    console.log('Please add the column manually in Supabase dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/rpgbyockvpannrupicno');
    console.log('2. Navigate to Table Editor > case_study_requests');
    console.log('3. Click "Add Column"');
    console.log('4. Name: scoring_schema_url');
    console.log('5. Type: text');
    console.log('6. Nullable: true');
    console.log('7. Click "Save"');
    
    console.log('\nAlternatively, run this SQL in the SQL Editor:');
    console.log('ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
addScoringSchemaColumn();
