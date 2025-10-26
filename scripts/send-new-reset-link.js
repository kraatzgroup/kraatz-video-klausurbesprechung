// Send a new password reset link for ill9293@tiffincrane.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
// This would need the service role key - for testing only
const supabaseServiceKey = 'YOUR_SERVICE_KEY_HERE';

async function sendNewResetLink() {
  try {
    console.log('📧 Sending new password reset link...');

    // Use the existing Edge Function
    const response = await fetch('https://rpgbyockvpannrupicno.supabase.co/functions/v1/reset-admin-dozent-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        email: 'ill9293@tiffincrane.com'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ New reset link sent:', result);
    } else {
      console.error('❌ Failed to send reset link:', result);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// For manual testing - you'd need to add the service key
console.log('💡 To send a new reset link, use the /forgot-password page or admin interface');
console.log('📧 Email: ill9293@tiffincrane.com');
