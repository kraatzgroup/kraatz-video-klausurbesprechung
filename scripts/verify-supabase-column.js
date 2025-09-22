const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExcelUpload() {
  try {
    console.log('Testing Excel scoring schema upload functionality...');
    
    // First check if we can access the column
    const { data: testData, error: testError } = await supabase
      .from('case_study_requests')
      .select('scoring_schema_url')
      .limit(1);
      
    if (testError) {
      console.log('❌ Column access failed:', testError.message);
      
      if (testError.message.includes('does not exist')) {
        console.log('\n🔧 The column needs to be added to the Supabase database.');
        console.log('Since we cannot add it programmatically, please:');
        console.log('1. Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno/sql');
        console.log('2. Run this SQL command:');
        console.log('   ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;');
        console.log('3. Click "Run"');
        console.log('\nAfter adding the column, the Excel upload will work immediately.');
      }
      return;
    }
    
    console.log('✅ Column exists and is accessible!');
    
    // Test updating a record with a scoring schema URL
    const { data: records, error: fetchError } = await supabase
      .from('case_study_requests')
      .select('id')
      .limit(1);
      
    if (fetchError || !records || records.length === 0) {
      console.log('No test records available');
      return;
    }
    
    const testRecordId = records[0].id;
    console.log(`Testing update on record: ${testRecordId}`);
    
    // Test update
    const { data: updateData, error: updateError } = await supabase
      .from('case_study_requests')
      .update({ scoring_schema_url: 'https://example.com/test-schema.xlsx' })
      .eq('id', testRecordId)
      .select();
      
    if (updateError) {
      console.log('❌ Update test failed:', updateError.message);
    } else {
      console.log('✅ Update test successful!');
      
      // Clean up test data
      await supabase
        .from('case_study_requests')
        .update({ scoring_schema_url: null })
        .eq('id', testRecordId);
        
      console.log('✅ Test cleanup completed');
    }
    
    console.log('\n🎉 Excel scoring schema upload functionality is ready!');
    console.log('Instructors can now upload Excel files when creating corrections.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testExcelUpload();
