// Test the new Mailgun-based password reset Edge Function
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMailgunPasswordReset() {
  try {
    console.log('🔐 Testing Mailgun password reset Edge Function...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Sending styled password reset email to:', testEmail);

    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: testEmail }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
    } else if (data?.error) {
      console.error('❌ Function returned error:', data.error);
    } else {
      console.log('✅ Password reset email sent successfully:', data);
      console.log('');
      console.log('📬 Expected email features:');
      console.log('   - ✅ Professional Kraatz Club branding');
      console.log('   - ✅ Styled HTML template matching other emails');
      console.log('   - ✅ User role and legal area information');
      console.log('   - ✅ Blue "Passwort zurücksetzen" button');
      console.log('   - ✅ Alternative copy-paste link');
      console.log('   - ✅ Security warnings and instructions');
      console.log('   - ✅ Recovery link with type=recovery');
      console.log('   - ✅ Sent via Mailgun (not Supabase auth)');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. Check email inbox for styled reset email');
      console.log('   2. Click the "Passwort zurücksetzen" button');
      console.log('   3. Should redirect to auth/callback with type=recovery');
      console.log('   4. Should show password reset form');
      console.log('   5. Enter new password and submit');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testMailgunPasswordReset();
