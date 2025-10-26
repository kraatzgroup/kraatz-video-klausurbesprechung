// Reset user password using admin API to restore login access
const { createClient } = require('@supabase/supabase-js');

// Use the service role key for admin operations
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetUserPasswordAdmin() {
  try {
    console.log('🔐 Resetting user password via admin API...');

    const email = 'ill9293@tiffincrane.com';
    const newPassword = 'TempPass2026!';
    
    console.log('📧 Resetting password for:', email);
    console.log('🔑 New password:', newPassword);

    // First, get the user ID
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error getting users:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ User not found:', email);
      return;
    }

    console.log('✅ Found user ID:', user.id);

    // Reset the password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    });

    if (error) {
      console.error('❌ Error resetting password:', error);
      return;
    }

    console.log('✅ Password reset successful!');
    console.log('');
    console.log('🎯 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to: https://klausuren.kraatz-club.de/admin');
    console.log('2. Login with the credentials above');
    console.log('3. Change password in profile settings');
    console.log('');
    console.log('⚠️ This is a temporary password - please change it immediately');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetUserPasswordAdmin();
