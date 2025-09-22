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
    console.log('Adding solution_pdf_url column to case_study_requests table...');
    
    // Check if column already exists
    const { data: columns, error: columnError } = await supabase
      .from('case_study_requests')
      .select('solution_pdf_url')
      .limit(1);

    if (!columnError) {
      console.log('✅ Column solution_pdf_url already exists');
      return;
    }

    // Add the column using RPC or direct SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT;`
    });

    if (error) {
      console.error('Error adding column:', error);
      console.log('\n📝 Manual SQL to execute in Supabase SQL Editor:');
      console.log('ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT;');
      return;
    }

    console.log('✅ Successfully added solution_pdf_url column');
    
  } catch (error) {
    console.error('Error:', error);
    console.log('\n📝 Manual SQL to execute in Supabase SQL Editor:');
    console.log('ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT;');
  }
}

addSolutionPdfColumn();
