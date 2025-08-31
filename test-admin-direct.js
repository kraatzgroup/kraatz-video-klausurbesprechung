const { createClient } = require('@supabase/supabase-js');

// Admin client with service role key
const supabaseAdmin = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

async function testAdminClient() {
  console.log('🔍 Testing admin client...');
  
  try {
    // Test 1: Raw query without any filters
    console.log('\n📊 Test 1: Raw query');
    const { data: rawData, error: rawError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    console.log('Raw data:', rawData);
    console.log('Raw error:', rawError);
    console.log('Raw count:', rawData?.length);
    
    // Test 2: With order by
    console.log('\n📊 Test 2: With order by');
    const { data: orderedData, error: orderedError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Ordered data:', orderedData);
    console.log('Ordered error:', orderedError);
    console.log('Ordered count:', orderedData?.length);
    
    // Test 3: Check RLS policies
    console.log('\n📊 Test 3: Check current role');
    const { data: roleData, error: roleError } = await supabaseAdmin
      .rpc('current_user_id');
    
    console.log('Current user/role:', roleData);
    console.log('Role error:', roleError);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminClient();
