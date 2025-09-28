const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_URL = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook';

async function setupStripeWebhook() {
  try {
    console.log('🔗 Setting up Stripe webhook...\n');

    // First, list existing webhooks to check if one already exists
    console.log('📋 Checking existing webhooks...');
    const existingWebhooks = await stripe.webhookEndpoints.list();
    
    const existingWebhook = existingWebhooks.data.find(webhook => 
      webhook.url === WEBHOOK_URL
    );

    if (existingWebhook) {
      console.log(`✅ Webhook already exists: ${existingWebhook.id}`);
      console.log(`   URL: ${existingWebhook.url}`);
      console.log(`   Status: ${existingWebhook.status}`);
      console.log(`   Events: ${existingWebhook.enabled_events.join(', ')}`);
      
      // Show the signing secret
      console.log('\n🔑 Webhook Signing Secret:');
      console.log('   You can find this in your Stripe Dashboard under:');
      console.log('   Developers > Webhooks > [Your Webhook] > Signing secret');
      console.log('   Set it in Supabase with:');
      console.log('   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...');
      
      return;
    }

    // Create new webhook endpoint
    console.log('🆕 Creating new webhook endpoint...');
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'checkout.session.completed'
      ],
      description: 'Kraatz Club Payment Processing Webhook'
    });

    console.log(`✅ Webhook created successfully: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.join(', ')}`);

    console.log('\n🔑 Webhook Signing Secret:');
    console.log(`   Secret: ${webhook.secret}`);
    console.log('\n⚠️ IMPORTANT: Set this secret in Supabase:');
    console.log(`   supabase secrets set STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

    console.log('\n🎉 Webhook setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy the webhook secret above');
    console.log('2. Run: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...');
    console.log('3. Test a payment to verify webhook delivery');

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    
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
  console.log('💡 Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe-webhook.js');
  process.exit(1);
}

// Run the script
setupStripeWebhook();
