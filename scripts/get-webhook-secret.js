const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_URL = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook';

async function getWebhookSecret() {
  try {
    console.log('🔍 Finding webhook and retrieving secret...\n');

    // List all webhooks
    const webhooks = await stripe.webhookEndpoints.list();
    
    // Find our webhook
    const webhook = webhooks.data.find(w => w.url === WEBHOOK_URL);
    
    if (!webhook) {
      console.error('❌ Webhook not found!');
      console.log('Available webhooks:');
      webhooks.data.forEach(w => {
        console.log(`  - ${w.url} (${w.id})`);
      });
      return;
    }

    console.log(`✅ Found webhook: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    
    // Retrieve the webhook to get the secret
    const webhookDetails = await stripe.webhookEndpoints.retrieve(webhook.id);
    
    if (webhookDetails.secret) {
      console.log('\n🔑 Webhook Secret Found:');
      console.log(`   ${webhookDetails.secret}`);
      
      console.log('\n📋 To set this secret in Supabase, run:');
      console.log(`   supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookDetails.secret}`);
      
      return webhookDetails.secret;
    } else {
      console.log('\n⚠️ Secret not available in API response');
      console.log('You need to get it manually from Stripe Dashboard:');
      console.log('1. Go to: https://dashboard.stripe.com/webhooks');
      console.log(`2. Click on webhook: ${webhook.id}`);
      console.log('3. Copy the "Signing secret" (starts with whsec_)');
    }

  } catch (error) {
    console.error('❌ Error retrieving webhook secret:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔑 Authentication failed - please check your Stripe secret key');
    } else {
      console.error('📝 Full error details:', error.message);
    }
  }
}

// Check if Stripe key is provided
if (!process.env.STRIPE_SECRET_KEY && !stripe.secretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('💡 Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/get-webhook-secret.js');
  process.exit(1);
}

// Run the script
getWebhookSecret();
