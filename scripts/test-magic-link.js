#!/usr/bin/env node

/**
 * Test magic link generation to check for localhost URLs
 */

async function testMagicLink() {
  try {
    const testEmail = 'test@example.com';
    
    console.log('🧪 Testing magic link generation...');
    console.log('📧 Test email:', testEmail);

    // Call the Edge Function directly
    const response = await fetch('https://rpgbyockvpannrupicno.supabase.co/functions/v1/send-student-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTM1MTksImV4cCI6MjA3MTk2OTUxOX0.YourAnonKeyHere'
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    console.log('📥 Response status:', response.status);
    
    const result = await response.json();
    console.log('📄 Response:', result);

    if (response.ok) {
      console.log('✅ Magic link function called successfully');
      if (result.magicLinkSent) {
        console.log('📧 Magic link email sent');
      }
    } else {
      console.log('❌ Magic link function failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testMagicLink();
