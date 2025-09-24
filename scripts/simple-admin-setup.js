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
