const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking case_study_ratings table schema...\n');

  try {
    // Fetch one row to see the structure
    const { data, error } = await supabase
      .from('case_study_ratings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Table columns:');
      console.log(Object.keys(data[0]));
      console.log('\n📋 Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️  No data in table');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema();
