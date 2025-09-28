const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createTestPromotionCode() {
  try {
    console.log('🎯 Creating 100% discount coupon and promotion code...\n');

    // Step 1: Create a 100% discount coupon
    console.log('📋 Creating coupon...');
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'forever',
      name: 'Test 100% Discount',
      metadata: {
        description: 'Test coupon for 100% discount on all packages',
        created_by: 'kraatz-club-setup'
      }
    });

    console.log(`✅ Coupon created: ${coupon.id}`);
    console.log(`   - Discount: ${coupon.percent_off}%`);
    console.log(`   - Duration: ${coupon.duration}`);

    // Step 2: Create promotion code "TEST100TEST"
    console.log('\n🏷️ Creating promotion code...');
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'TEST100TEST',
      active: true,
      metadata: {
        description: 'Test promotion code for 100% discount',
        usage: 'testing_purposes'
      }
    });

    console.log(`✅ Promotion code created: ${promotionCode.code}`);
    console.log(`   - Coupon ID: ${promotionCode.coupon}`);
    console.log(`   - Active: ${promotionCode.active}`);

    console.log('\n🎉 Test promotion code setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`Promotion Code: TEST100TEST`);
    console.log(`Discount: 100% (FREE)`);
    console.log(`Valid for: All packages`);
    console.log(`Usage: Unlimited`);
    console.log(`Status: Active`);

    console.log('\n💡 How to use:');
    console.log('1. Go to http://localhost:3000/packages');
    console.log('2. Select any package and click "Jetzt kaufen"');
    console.log('3. In Stripe Checkout, click "Add promotion code"');
    console.log('4. Enter: TEST100TEST');
    console.log('5. The price will be reduced to €0.00');

    console.log('\n⚠️ Note: This is a test code for development purposes.');

  } catch (error) {
    console.error('❌ Error creating promotion code:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔑 Authentication failed - please check your Stripe secret key');
    } else if (error.code === 'resource_already_exists') {
      console.error('📋 Promotion code "TEST100TEST" already exists');
      console.log('\n💡 You can use the existing code or delete it first in Stripe Dashboard');
    } else {
      console.error('📝 Full error details:', error.message);
    }
  }
}

// Check if Stripe key is provided
if (!process.env.STRIPE_SECRET_KEY && !stripe.secretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('💡 Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/create-test-promotion-code.js');
  process.exit(1);
}

// Run the script
createTestPromotionCode();
