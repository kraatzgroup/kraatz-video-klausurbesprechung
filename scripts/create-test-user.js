const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

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
