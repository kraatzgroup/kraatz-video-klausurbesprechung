const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_URL = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook';

async function updateWebhookEvents() {
  try {
    console.log('🔄 Updating webhook events...\n');

    // Find existing webhook
    const webhooks = await stripe.webhookEndpoints.list();
    const webhook = webhooks.data.find(w => w.url === WEBHOOK_URL);
    
    if (!webhook) {
      console.error('❌ Webhook not found!');
      return;
    }

    console.log(`✅ Found webhook: ${webhook.id}`);
    console.log(`   Current events: ${webhook.enabled_events.join(', ')}`);

    // Update webhook to include checkout.session.completed
    const updatedWebhook = await stripe.webhookEndpoints.update(webhook.id, {
      enabled_events: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'checkout.session.completed'
      ]
    });

    console.log('\n🎉 Webhook updated successfully!');
    console.log(`   Updated events: ${updatedWebhook.enabled_events.join(', ')}`);
    console.log(`   Status: ${updatedWebhook.status}`);

    console.log('\n💡 Now your webhook will receive:');
    console.log('   ✅ payment_intent.succeeded (for regular payments)');
    console.log('   ✅ payment_intent.payment_failed (for failed payments)');
    console.log('   ✅ checkout.session.completed (for 100% discount/promo codes)');

  } catch (error) {
    console.error('❌ Error updating webhook:', error);
    
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
  console.log('💡 Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/update-webhook-events.js');
  process.exit(1);
}

// Run the script
updateWebhookEvents();
