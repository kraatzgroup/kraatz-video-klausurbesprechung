const https = require('https');

const WEBHOOK_URL = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook';

// Test payload simulating a checkout.session.completed event
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_session_123',
      object: 'checkout.session',
      amount_total: 0, // 100% discount
      metadata: {
        packageId: 'f818b42d-b89f-46a5-9e70-2bffb9d7d9ff', // Use a real package ID
        userId: 'a3559801-c2a0-4e87-80fd-2aa6fececbc5' // Use a real user ID
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook endpoint...\n');
    
    const payload = JSON.stringify(testPayload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'stripe-signature': 'test-signature', // This will fail signature verification but test the endpoint
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      }
    };

    console.log('📤 Sending test payload to:', WEBHOOK_URL);
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

    const url = new URL(WEBHOOK_URL);
    
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📥 Response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        
        if (res.statusCode === 200) {
          console.log('\n✅ Webhook endpoint is reachable!');
        } else {
          console.log('\n⚠️ Webhook returned non-200 status');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
    });

    req.write(payload);
    req.end();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log('🔗 Testing Stripe Webhook Endpoint');
console.log('🎯 This will test if the webhook is reachable and responding');
console.log('⚠️ Note: Signature verification will fail, but that\'s expected for this test\n');

testWebhook();
