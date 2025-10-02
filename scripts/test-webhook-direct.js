#!/usr/bin/env node

/**
 * Test webhook endpoint directly without Supabase client
 */

const crypto = require('crypto');

async function testWebhookDirect() {
  try {
    const webhookUrl = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook';
    
    // Create a test payload
    const testPayload = {
      id: "evt_test_webhook",
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cus_TABEVuaQKYXkRy",
          object: "customer",
          email: "luetzenburger.philipp@googlemail.com",
          name: "Phillipp Lützenburger"
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      },
      type: "customer.updated"
    };

    const payloadString = JSON.stringify(testPayload);
    
    // Create a fake Stripe signature (this won't work for real verification)
    const fakeSignature = 't=1234567890,v1=fakesignature';

    console.log('🧪 Testing webhook endpoint directly...');
    console.log('📤 URL:', webhookUrl);
    console.log('📦 Payload size:', payloadString.length, 'bytes');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': fakeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payloadString
    });

    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.status === 401) {
      console.log('❌ 401 Authorization Error - Edge Function requires authentication');
      console.log('💡 This means Supabase is blocking the request before it reaches our function');
    } else if (response.status === 400) {
      console.log('✅ Function is accessible - 400 likely means signature verification failed (expected)');
    } else {
      console.log('🤔 Unexpected response status');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testWebhookDirect();
