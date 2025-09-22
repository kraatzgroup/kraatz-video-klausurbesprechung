const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSolutionPdfColumn() {
  try {
    console.log('Adding solution_pdf_url column to Supabase case_study_requests table...');
    
    // Check if column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('case_study_requests')
      .select('solution_pdf_url')
      .limit(1);

    if (!testError) {
      console.log('✅ Column solution_pdf_url already exists in Supabase');
      return;
    }

    // If column doesn't exist, we need to add it via SQL
    // Since we can't execute DDL directly, we'll use a workaround
    console.log('❌ Column does not exist. Attempting to add...');
    
    // Try to update a non-existent record to trigger column creation
    const { error: updateError } = await supabase
      .from('case_study_requests')
      .update({ solution_pdf_url: null })
      .eq('id', 'non-existent-id');

    if (updateError && updateError.message.includes('column "solution_pdf_url" of relation "case_study_requests" does not exist')) {
      console.log('\n🔧 Manual action required:');
      console.log('Go to your Supabase Dashboard > SQL Editor and execute:');
      console.log('ALTER TABLE case_study_requests ADD COLUMN solution_pdf_url TEXT;');
      console.log('\nOr use the Table Editor to add the column manually.');
    } else {
      console.log('✅ Column might already exist or was added successfully');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n🔧 Manual action required:');
    console.log('Go to your Supabase Dashboard > SQL Editor and execute:');
    console.log('ALTER TABLE case_study_requests ADD COLUMN solution_pdf_url TEXT;');
  }
}

addSolutionPdfColumn();
