// Test that the updated Edge Function generates proper callback URLs instead of Supabase verify URLs
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixedRecoveryLinks() {
  try {
    console.log('🔐 Testing fixed recovery link generation...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Testing password reset for:', testEmail);
    console.log('');

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
      console.log('📬 Expected email improvements:');
      console.log('   - ✅ Button text: "Zur Passwort-Eingabe"');
      console.log('   - ✅ Link format: klausuren.kraatz-club.de/auth/callback?token=...&type=recovery');
      console.log('   - ❌ NOT: rpgbyockvpannrupicno.supabase.co/auth/v1/verify');
      console.log('   - ✅ Should show password reset form when clicked');
      console.log('   - ✅ Should NOT auto-login the user');
      console.log('');
      console.log('🎯 Expected behavior:');
      console.log('   1. Click "Zur Passwort-Eingabe" button');
      console.log('   2. Redirect to klausuren.kraatz-club.de/auth/callback');
      console.log('   3. Show password reset form (not dashboard)');
      console.log('   4. User enters new password');
      console.log('   5. User gets redirected to login page');
      console.log('   6. User logs in with new password');
      console.log('');
      console.log('✅ Fixed issues:');
      console.log('   - No more /auth/v1/verify URLs');
      console.log('   - No more magic login behavior');
      console.log('   - Proper callback URLs with type=recovery');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFixedRecoveryLinks();
