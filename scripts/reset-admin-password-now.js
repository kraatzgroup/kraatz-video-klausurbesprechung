// Reset admin@kraatz-club.de password to Admin123! immediately
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQyMzI5OSwiZXhwIjoyMDQ2OTk5Mjk5fQ.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...');

    const email = 'admin@kraatz-club.de';
    const newPassword = 'Admin123!';
    
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);

    // Get all users to find the admin
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error getting users:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ User not found:', email);
      console.log('Available users:');
      users.users.forEach(u => console.log('  -', u.email));
      return;
    }

    console.log('✅ Found user ID:', user.id);

    // Reset password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    });

    if (error) {
      console.error('❌ Password reset failed:', error);
      return;
    }

    console.log('✅ PASSWORD RESET SUCCESSFUL!');
    console.log('');
    console.log('🎯 LOGIN CREDENTIALS:');
    console.log('Email: admin@kraatz-club.de');
    console.log('Password: Admin123!');
    console.log('');
    console.log('🌐 LOGIN URL:');
    console.log('https://klausuren.kraatz-club.de/admin');
    console.log('');
    console.log('✅ You can now login immediately!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetAdminPassword();
