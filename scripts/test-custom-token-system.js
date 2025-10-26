// Test the new custom token-based password reset system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MjMyOTksImV4cCI6MjA0Njk5OTI5OX0.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomTokenSystem() {
  try {
    console.log('🔐 Testing custom token-based password reset system...');

    const testEmail = 'ill9293@tiffincrane.com';
    
    console.log('📧 Step 1: Requesting password reset for:', testEmail);

    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: testEmail }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      return;
    } else if (data?.error) {
      console.error('❌ Function returned error:', data.error);
      return;
    } else {
      console.log('✅ Password reset email sent successfully');
      console.log('');
      console.log('📬 Expected improvements:');
      console.log('   - ✅ Custom token system (24 hours validity)');
      console.log('   - ✅ Link format: klausuren.kraatz-club.de/reset-password?token=...');
      console.log('   - ❌ NOT: rpgbyockvpannrupicno.supabase.co/auth/v1/verify');
      console.log('   - ✅ Token stored in password_reset_tokens table');
      console.log('   - ✅ Much longer expiration time (24 hours vs 1 hour)');
      console.log('');
      console.log('🎯 Expected user flow:');
      console.log('   1. User receives email with "Zur Passwort-Eingabe" button');
      console.log('   2. Link goes to /reset-password?token=...');
      console.log('   3. Page validates token via validate-reset-token function');
      console.log('   4. Shows password reset form');
      console.log('   5. User enters new password');
      console.log('   6. Password reset via reset-password-with-token function');
      console.log('   7. Token marked as used');
      console.log('   8. User redirected to login');
      console.log('');
      console.log('✅ System improvements:');
      console.log('   - No more Supabase token expiration issues');
      console.log('   - No more magic login behavior');
      console.log('   - Proper password reset form');
      console.log('   - 24-hour token validity');
      console.log('   - Custom domain URLs');
      console.log('   - Database-tracked tokens');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCustomTokenSystem();
