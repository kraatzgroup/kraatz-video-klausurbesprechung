const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  try {
    console.log('Attempting to add scoring_schema_url column...');
    
    // Try using the SQL execution via HTTP directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: 'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_schema_url TEXT;'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Response error:', errorText);
      
      // Try creating a function first, then executing it
      console.log('Creating SQL execution function...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION execute_sql(sql_text TEXT)
        RETURNS TEXT AS $$
        BEGIN
          EXECUTE sql_text;
          RETURN 'Success';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN SQLERRM;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Try to create and use the function
      const { data: funcData, error: funcError } = await supabase.rpc('execute_sql', {
        sql_text: 'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_schema_url TEXT;'
      });
      
      if (funcError) {
        console.error('Function execution error:', funcError);
        
        // Last resort: try to use existing database functions
        console.log('Trying to use database metadata functions...');
        
        // Check if we can access pg_catalog
        const { data: catalogData, error: catalogError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'case_study_requests')
          .eq('column_name', 'scoring_schema_url');
          
        if (catalogError) {
          console.error('Cannot access information_schema:', catalogError);
        } else {
          console.log('Column check result:', catalogData);
        }
        
        console.log('\n❌ Unable to add column programmatically.');
        console.log('Please add it manually in Supabase Dashboard:');
        console.log('1. Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno');
        console.log('2. Table Editor → case_study_requests');
        console.log('3. Add Column: scoring_schema_url (TEXT, nullable)');
        
      } else {
        console.log('✅ Function result:', funcData);
      }
    } else {
      console.log('✅ SQL executed successfully!');
    }
    
    // Final verification
    setTimeout(async () => {
      console.log('Verifying column exists...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('case_study_requests')
        .select('scoring_schema_url')
        .limit(1);
        
      if (!verifyError) {
        console.log('✅ SUCCESS: scoring_schema_url column exists and is accessible!');
      } else {
        console.log('❌ Column verification failed:', verifyError.message);
      }
    }, 2000);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
executeSQL();
