const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addColumnDirectly() {
  try {
    console.log('Attempting to add solution_pdf_url column via SQL...');
    
    // Try using the sql method if available
    const { data, error } = await supabase
      .from('case_study_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Connection error:', error);
      return;
    }

    console.log('Connected to Supabase successfully');
    
    // Check existing columns
    const columns = Object.keys(data[0] || {});
    console.log('Existing columns:', columns);
    
    if (columns.includes('solution_pdf_url')) {
      console.log('✅ Column solution_pdf_url already exists');
      return;
    }

    console.log('❌ Column solution_pdf_url does not exist');
    console.log('\n🔧 You need to manually add the column in Supabase:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Table Editor > case_study_requests');
    console.log('4. Click "Add Column"');
    console.log('5. Name: solution_pdf_url');
    console.log('6. Type: text');
    console.log('7. Nullable: Yes');
    console.log('8. Click "Save"');
    
    console.log('\nAlternatively, use SQL Editor with:');
    console.log('ALTER TABLE case_study_requests ADD COLUMN solution_pdf_url TEXT;');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addColumnDirectly();
