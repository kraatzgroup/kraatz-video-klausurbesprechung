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

async function addColumnDirectly() {
  try {
    console.log('Adding scoring_schema_url column to case_study_requests table...');
    
    // Use the SQL function to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;'
    });

    if (error) {
      console.error('Error with exec_sql:', error);
      
      // Try alternative approach using the REST API directly
      console.log('Trying direct REST API approach...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          query: 'ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;'
        })
      });
      
      if (response.ok) {
        console.log('✅ Column added successfully via REST API!');
      } else {
        const errorText = await response.text();
        console.error('REST API error:', errorText);
        
        // Try using pg_admin functions
        console.log('Trying pg_admin approach...');
        
        const { data: adminData, error: adminError } = await supabase.rpc('pg_admin_execute', {
          sql: 'ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;'
        });
        
        if (adminError) {
          console.error('pg_admin error:', adminError);
          console.log('Manual intervention required. Please add the column via Supabase dashboard.');
        } else {
          console.log('✅ Column added successfully via pg_admin!');
        }
      }
    } else {
      console.log('✅ Column added successfully!');
    }
    
    // Verify the column was added
    console.log('Verifying column was added...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('case_study_requests')
      .select('scoring_schema_url')
      .limit(1);
      
    if (!verifyError) {
      console.log('✅ Verification successful - scoring_schema_url column exists!');
    } else if (verifyError.message.includes('does not exist')) {
      console.log('❌ Column was not added successfully');
    } else {
      console.log('Verification result:', verifyError);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
addColumnDirectly();
