const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

async function createInstructor() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Creating instructor account...');
    
    // Create instructor user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dozent@kraatz-club.de',
      password: 'Dozent123!',
      user_metadata: {
        first_name: 'Prof.',
        last_name: 'Kraatz'
      },
      email_confirm: true
    });

    if (authError) {
      console.log('Instructor creation error (might already exist):', authError.message);
    } else {
      console.log('✅ Instructor user created successfully');
    }

    // Update user role to instructor in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'instructor' })
      .eq('email', 'dozent@kraatz-club.de');

    if (updateError) {
      console.log('Role update error:', updateError.message);
    } else {
      console.log('✅ User role updated to instructor');
    }

    console.log('\n🎓 Instructor Account Created:');
    console.log('📧 Email: dozent@kraatz-club.de');
    console.log('🔑 Password: Dozent123!');
    console.log('👨‍🏫 Role: Instructor');

    // Test login
    console.log('\nTesting instructor login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'dozent@kraatz-club.de',
      password: 'Dozent123!'
    });

    if (loginError) {
      console.log('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Instructor login successful');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createInstructor();
