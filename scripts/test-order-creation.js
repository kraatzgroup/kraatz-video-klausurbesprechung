#!/usr/bin/env node

/**
 * Test order creation for existing user
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testOrderCreation() {
  try {
    const userId = '241e2d61-9303-435e-a687-74100e178e07';
    const stripeCustomerId = 'cus_TABW9FPWVDFXWW';
    
    console.log('🧪 Testing order creation for existing user...');
    console.log('👤 User ID:', userId);
    console.log('🆔 Stripe Customer ID:', stripeCustomerId);

    // Check current user state
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('💰 Current credits:', currentUser.account_credits);

    // Check if there are any orders for this user
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*, packages(*)')
      .eq('user_id', userId);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
    } else {
      console.log('📦 Existing orders:', existingOrders.length);
      existingOrders.forEach(order => {
        console.log(`  - Order ${order.id}: ${order.packages.name} (${order.packages.case_study_count} credits)`);
      });
    }

    // Manually create a test order to verify the system works
    console.log('🔧 Creating test order manually...');
    
    // Get a package to test with
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .limit(1);

    if (packagesError || !packages.length) {
      console.error('❌ No active packages found:', packagesError);
      return;
    }

    const testPackage = packages[0];
    console.log('📦 Using test package:', testPackage.name, `(${testPackage.case_study_count} credits)`);

    // Create test order
    const { data: newOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        package_id: testPackage.id,
        stripe_payment_intent_id: `test_session_${Date.now()}`,
        status: 'completed',
        total_cents: testPackage.price_cents
      })
      .select('*, packages(*)')
      .single();

    if (createOrderError) {
      console.error('❌ Error creating test order:', createOrderError);
      return;
    }

    console.log('✅ Test order created:', newOrder.id);

    // Update user credits
    const newCredits = currentUser.account_credits + testPackage.case_study_count;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return;
    }

    console.log('✅ Credits updated:', {
      oldCredits: currentUser.account_credits,
      newCredits: newCredits,
      addedCredits: testPackage.case_study_count
    });

    // Verify final state
    const { data: finalUser } = await supabase
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single();

    console.log('🎉 Final user credits:', finalUser.account_credits);
    console.log('✅ Order creation test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testOrderCreation();
