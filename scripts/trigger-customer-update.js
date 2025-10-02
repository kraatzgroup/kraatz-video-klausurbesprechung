#!/usr/bin/env node

/**
 * Trigger a customer.updated event by updating the Stripe customer
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

async function triggerCustomerUpdate() {
  try {
    const customerId = 'cus_TABEVuaQKYXkRy';
    const testEmail = 'test.auto.creation@example.com';
    
    console.log('🔄 Updating Stripe customer to trigger webhook...');
    console.log('🆔 Customer ID:', customerId);
    console.log('📧 New email:', testEmail);

    // Update the Stripe customer
    const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testEmail,
        name: 'Test Auto Creation User'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Stripe API error:', error);
      return;
    }

    const customer = await response.json();
    console.log('✅ Customer updated successfully:', {
      id: customer.id,
      email: customer.email,
      name: customer.name
    });

    console.log('📡 This should trigger a customer.updated webhook...');
    console.log('⏳ Wait a few seconds, then check the Edge Function logs');
    console.log('🔍 The webhook should automatically create a user for:', testEmail);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('💡 Check the Supabase Edge Function logs to see if user was created');
    console.log('💡 You can also check the users table for:', testEmail);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

triggerCustomerUpdate();
