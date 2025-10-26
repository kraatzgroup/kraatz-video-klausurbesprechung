// Direct test of the welcome email Edge Function
// This simulates what happens when a user is created

const testWelcomeEmail = async () => {
  const testData = {
    email: 'blush6559@tiffincrane.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'instructor',
    legalArea: 'Zivilrecht'
  };

  console.log('🧪 Testing welcome email Edge Function...');
  console.log('📧 Test data:', testData);

  try {
    // Make a direct fetch request to the Edge Function
    const response = await fetch('https://rpgbyockvpannrupicno.supabase.co/functions/v1/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Welcome email test successful:', result);
    } else {
      console.error('❌ Welcome email test failed:', result);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  testWelcomeEmail();
}

// For browser environment
if (typeof window !== 'undefined') {
  window.testWelcomeEmail = testWelcomeEmail;
}
