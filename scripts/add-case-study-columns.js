require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCaseStudyColumns() {
  try {
    console.log('Adding case study tracking columns to users table...');

    // Add columns for case study tracking
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS available_case_studies INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS used_case_studies INTEGER DEFAULT 0;
        
        -- Update existing users with default values
        UPDATE public.users 
        SET available_case_studies = 0, used_case_studies = 0 
        WHERE available_case_studies IS NULL OR used_case_studies IS NULL;
      `
    });

    if (error) {
      console.error('Error adding columns:', error);
      return;
    }

    console.log('✅ Case study columns added successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addCaseStudyColumns();
