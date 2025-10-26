// Send emergency magic link to restore access
const { createClient } = require('@supabase/supabase-js');

// Use the service role key for admin operations
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function sendEmergencyMagicLink() {
  try {
    console.log('🚨 Sending emergency magic link...');

    const email = 'ill9293@tiffincrane.com';
    
    console.log('📧 Generating magic link for:', email);

    // Generate magic link that redirects to profile
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://klausuren.kraatz-club.de/profile'
      }
    });

    if (error) {
      console.error('❌ Error generating magic link:', error);
      return;
    }

    const magicLink = data.properties?.action_link;
    
    if (!magicLink) {
      console.error('❌ No magic link generated');
      return;
    }

    console.log('✅ Emergency magic link generated:');
    console.log('');
    console.log('🔗 MAGIC LINK:');
    console.log(magicLink);
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Copy the link above');
    console.log('2. Paste it in your browser');
    console.log('3. You will be automatically logged in');
    console.log('4. You will be redirected to /profile');
    console.log('5. Change your password in settings if needed');
    console.log('');
    console.log('⏰ This link expires in 1 hour');
    console.log('🔒 This link is for emergency access only');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendEmergencyMagicLink();
