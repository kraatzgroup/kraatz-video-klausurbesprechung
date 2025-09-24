require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function createTestUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Creating test user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@kraatz-club.de',
      password: 'Demo123!',
      user_metadata: {
        first_name: 'Demo',
        last_name: 'User'
      },
      email_confirm: true
    });

    if (authError) {
      console.log('User creation error (might already exist):', authError.message);
    } else {
      console.log('✅ Test user created successfully');
      console.log('📧 Email: demo@kraatz-club.de');
      console.log('🔑 Password: Demo123!');
    }

    // Test login with the new user
    console.log('\nTesting login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'demo@kraatz-club.de',
      password: 'Demo123!'
    });

    if (loginError) {
      console.log('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login test successful');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
