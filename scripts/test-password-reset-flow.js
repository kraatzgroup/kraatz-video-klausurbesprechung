// Test the password reset flow to ensure it sends recovery links, not magic links
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordResetFlow() {
  try {
    console.log('🔐 Testing password reset flow...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Sending password reset email to:', testEmail);

    // This should send a recovery email, not a magic link
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'https://klausuren.kraatz-club.de/auth/callback'
    });

    if (error) {
      console.error('❌ Password reset error:', error);
    } else {
      console.log('✅ Password reset email sent successfully');
      console.log('📬 Expected email format:');
      console.log('   - Subject: Reset your password');
      console.log('   - Link format: https://klausuren.kraatz-club.de/auth/callback?token=...&type=recovery');
      console.log('   - NOT a magic login link');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. Check email inbox for reset email');
      console.log('   2. Click the reset link');
      console.log('   3. Should show password reset form (not auto-login)');
      console.log('   4. Enter new password');
      console.log('   5. Should redirect to admin login');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPasswordResetFlow();
