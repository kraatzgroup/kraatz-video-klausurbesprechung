// Test basic login functionality to diagnose the 400 Bad Request issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicLogin() {
  try {
    console.log('🔐 Testing basic login functionality...');
    console.log('');

    // Test with known credentials
    const testEmail = 'ill9293@tiffincrane.com';
    const testPassword = '!Banana#2026'; // Last known working password
    
    console.log('📧 Testing login with:');
    console.log('Email:', testEmail);
    console.log('Password: [REDACTED]');
    console.log('');

    console.log('🔍 Attempting login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ Login failed with error:', error);
      console.error('Error code:', error.status);
      console.error('Error message:', error.message);
      
      if (error.status === 400) {
        console.log('');
        console.log('🔍 400 Bad Request Analysis:');
        console.log('   - Could be invalid credentials');
        console.log('   - Could be account locked/disabled');
        console.log('   - Could be email not confirmed');
        console.log('   - Could be Supabase configuration issue');
      }
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log('🚪 Signed out after test');
    }

    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check if user exists in auth.users table');
    console.log('2. Check if email is confirmed');
    console.log('3. Check if account is disabled');
    console.log('4. Try password reset to get fresh credentials');
    console.log('5. Check Supabase project settings');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBasicLogin();
