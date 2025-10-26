// Test that the password reset Edge Function generates proper recovery links
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRecoveryLinkGeneration() {
  try {
    console.log('🔐 Testing recovery link generation...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Testing password reset for:', testEmail);
    console.log('');

    // This should generate recovery links, not magic links
    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: testEmail }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
    } else if (data?.error) {
      console.error('❌ Function returned error:', data.error);
    } else {
      console.log('✅ Password reset email sent successfully');
      console.log('');
      console.log('📬 Expected email features:');
      console.log('   - ✅ Button text: "Neues Passwort festlegen"');
      console.log('   - ✅ Link format: ...auth/callback?token=...&type=recovery');
      console.log('   - ✅ NOT a magic login link');
      console.log('   - ✅ Should show password reset form when clicked');
      console.log('   - ✅ Should NOT auto-login the user');
      console.log('');
      console.log('🎯 Link behavior:');
      console.log('   1. Click "Neues Passwort festlegen" button');
      console.log('   2. Should redirect to auth/callback with type=recovery');
      console.log('   3. Should show password reset form (not dashboard)');
      console.log('   4. User enters new password');
      console.log('   5. User gets redirected to login page');
      console.log('   6. User logs in with new password');
      console.log('');
      console.log('❌ If it auto-logs in instead:');
      console.log('   - The link is a magic link (wrong type)');
      console.log('   - Check Edge Function logs for link generation');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testRecoveryLinkGeneration();
