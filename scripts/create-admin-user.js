const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@kraatz-club.de',
      password: 'Admin123!',
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@kraatz-club.de',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        available_case_studies: 1000,
        used_case_studies: 0
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@kraatz-club.de');
    console.log('🔑 Password: Admin123!');
    console.log('🎯 Role: admin');
    console.log('📍 Access: http://localhost:3000/admin');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
