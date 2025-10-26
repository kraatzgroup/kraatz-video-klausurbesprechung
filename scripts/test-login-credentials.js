// Test login credentials for ill9293@tiffincrane.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginCredentials() {
  try {
    console.log('🔐 Testing login credentials...');

    const email = 'ill9293@tiffincrane.com';
    const password = '!Banana#2026';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      console.log('');
      console.log('🔍 Possible issues:');
      console.log('   - Password was not successfully reset');
      console.log('   - User account is disabled');
      console.log('   - Email/password combination is incorrect');
      console.log('');
      console.log('🎯 Solutions:');
      console.log('   1. Try password reset again at /forgot-password');
      console.log('   2. Check if user exists in database');
      console.log('   3. Verify password was actually changed');
    } else {
      console.log('✅ Login successful!');
      console.log('👤 User:', data.user?.email);
      console.log('🔑 Session:', data.session ? 'Active' : 'None');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. User should be able to login at /admin');
      console.log('   2. Should be redirected to /admin/dashboard');
      console.log('   3. Should have access to instructor features');
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log('🚪 Signed out after test');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLoginCredentials();
