// Copy and paste this into the browser console on localhost:3000
// This will use the existing Supabase admin client to test the welcome email

async function testWelcomeEmailInBrowser() {
  try {
    console.log('🧪 Testing welcome email from browser...');

    // Test data
    const testData = {
      email: 'test-welcome-demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'instructor',
      legalArea: 'Strafrecht'
    };

    console.log('📧 Sending test welcome email with data:', testData);

    // Use the global supabase client if available
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase.functions.invoke('send-welcome-email', {
        body: testData
      });

      if (error) {
        console.error('❌ Error:', error);
      } else {
        console.log('✅ Success:', data);
      }
    } else {
      console.error('❌ Supabase client not found in browser');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testWelcomeEmailInBrowser();
