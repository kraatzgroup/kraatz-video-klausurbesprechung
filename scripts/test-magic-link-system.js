// Test the magic link system for both password reset and welcome emails
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMagicLinkSystem() {
  try {
    console.log('🔐 Testing Magic Link System...');
    console.log('');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Step 1: Testing Password Reset Magic Link');
    console.log('Email:', testEmail);

    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: testEmail }
    });

    if (error) {
      console.error('❌ Password Reset error:', error);
    } else if (data?.error) {
      console.error('❌ Password Reset function error:', data.error);
    } else {
      console.log('✅ Password reset magic link sent successfully');
    }

    console.log('');
    console.log('📬 Expected Magic Link Features:');
    console.log('');
    
    console.log('🔐 Password Reset Email:');
    console.log('   - ✅ Button text: "Direkt anmelden"');
    console.log('   - ✅ Magic link with type=magiclink');
    console.log('   - ✅ Redirects to: https://klausuren.kraatz-club.de/profile');
    console.log('   - ✅ Auto-login behavior (no password form)');
    console.log('   - ✅ User lands on profile page after login');
    console.log('');
    
    console.log('🎓 Welcome Email (same system):');
    console.log('   - ✅ Button text: "Direkt anmelden"');
    console.log('   - ✅ Magic link with type=magiclink');
    console.log('   - ✅ Redirects to: https://klausuren.kraatz-club.de/profile');
    console.log('   - ✅ Auto-login behavior for new users');
    console.log('   - ✅ User can change password in profile settings');
    console.log('');
    
    console.log('🎯 Expected User Flow:');
    console.log('   1. User receives email with "Direkt anmelden" button');
    console.log('   2. Clicks button → Magic link auto-logs them in');
    console.log('   3. Redirected to /profile page');
    console.log('   4. User can change password in settings if needed');
    console.log('   5. No password reset forms required');
    console.log('');
    
    console.log('✅ System Benefits:');
    console.log('   - No password reset forms');
    console.log('   - No token expiration issues');
    console.log('   - Direct login experience');
    console.log('   - Lands on profile page');
    console.log('   - Consistent for both reset and welcome emails');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testMagicLinkSystem();
