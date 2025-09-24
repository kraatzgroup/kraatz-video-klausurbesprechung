require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

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
