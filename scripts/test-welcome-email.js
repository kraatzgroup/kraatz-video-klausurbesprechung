const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWelcomeEmail() {
  try {
    console.log('🧪 Testing welcome email function...');

    const testData = {
      email: 'yoshikorural@tiffincrane.com',
      firstName: 'Tim',
      lastName: 'Test',
      role: 'instructor',
      legalArea: 'Zivilrecht'
    };

    console.log('📧 Sending test welcome email with data:', testData);

    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: testData
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success:', data);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWelcomeEmail();
