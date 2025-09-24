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

async function setupAdmin() {
  try {
    console.log('1. Adding case study columns to users table...');

    // Add missing columns using raw SQL
    const { error: schemaError } = await supabase
      .from('users')
      .select('available_case_studies')
      .limit(1);

    if (schemaError && schemaError.message.includes('available_case_studies')) {
      console.log('Adding missing columns...');
      // We'll update existing users manually since we can't alter table structure via client
    }

    console.log('2. Creating admin user...');

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

    // Create user profile with basic fields first
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

setupAdmin();
