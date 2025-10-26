// Simple test using the existing admin client setup
const { getSupabaseAdmin } = require('../src/lib/supabase-admin.ts');

async function testWelcomeEmail() {
  try {
    console.log('🧪 Testing welcome email function with admin client...');

    // Use the existing admin client
    const supabaseAdmin = getSupabaseAdmin();

    const testData = {
      email: 'yoshikorural@tiffincrane.com',
      firstName: 'Tim',
      lastName: 'Test',
      role: 'instructor',
      legalArea: 'Zivilrecht'
    };

    console.log('📧 Sending test welcome email with data:', testData);

    const { data, error } = await supabaseAdmin.functions.invoke('send-welcome-email', {
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
