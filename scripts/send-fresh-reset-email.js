// Send a fresh password reset email for ill9293@tiffincrane.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendFreshResetEmail() {
  try {
    console.log('📧 Sending fresh password reset email...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('🔐 Requesting new password reset for:', testEmail);

    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: testEmail }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
    } else if (data?.error) {
      console.error('❌ Function returned error:', data.error);
    } else {
      console.log('✅ Fresh password reset email sent successfully');
      console.log('📬 Message:', data?.message);
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. Check email inbox for new reset email');
      console.log('   2. Click "Neues Passwort festlegen" button');
      console.log('   3. Should show password reset form');
      console.log('   4. Enter new password (different from old one)');
      console.log('   5. Login with new password at /admin');
      console.log('');
      console.log('💡 Suggested new password: SecurePass2026!');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

sendFreshResetEmail();
