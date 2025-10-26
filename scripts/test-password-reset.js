// Test the new admin password reset Edge Function
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  try {
    console.log('🔐 Testing admin password reset Edge Function...');

    const testData = {
      email: 'ill9293@tiffincrane.com',
      newPassword: 'FreshPassword2025!',
      adminUserId: null // Skip admin verification for testing
    };

    console.log('📧 Resetting password for:', testData.email);

    const { data, error } = await supabase.functions.invoke('admin-password-reset', {
      body: testData
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
    } else {
      console.log('✅ Password reset successful:', data);
      console.log('🎯 New password:', testData.newPassword);
      console.log('🔗 Login URL: https://klausuren.kraatz-club.de/admin-login');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPasswordReset();
