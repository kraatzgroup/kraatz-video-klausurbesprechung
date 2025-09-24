require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Admin client with service role key
const supabaseAdmin = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
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
