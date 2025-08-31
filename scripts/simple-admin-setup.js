const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  try {
    // First, let's check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@kraatz-club.de')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@kraatz-club.de');
      console.log('🔑 Password: Admin123!');
      console.log('📍 Access: http://localhost:3000/admin');
      return;
    }

    console.log('Creating new admin user...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@kraatz-club.de',
      password: 'Admin123!',
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created with ID:', authData.user.id);

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@kraatz-club.de',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        account_credits: 0
      });

    if (profileError) {
      console.error('Profile error:', profileError);
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

createAdmin();
