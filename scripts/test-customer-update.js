#!/usr/bin/env node

/**
 * Test customer.updated webhook event manually
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testCustomerUpdate() {
  try {
    console.log('🧪 Testing customer.updated webhook event...');

    // Simulate the customer.updated event data
    const customerData = {
      id: "cus_TABEVuaQKYXkRy",
      object: "customer",
      email: "luetzenburger.philipp@googlemail.com",
      name: "Phillipp Lützenburger"
    };

    console.log('📤 Calling stripe-webhook with customer.updated event...');

    const { data, error } = await supabase.functions.invoke('stripe-webhook', {
      body: {
        type: 'customer.updated',
        data: {
          object: customerData
        }
      }
    });

    if (error) {
      console.error('❌ Error calling webhook:', error);
      return;
    }

    console.log('✅ Webhook response:', data);

    // Check if user was updated
    console.log('🔍 Checking user in database...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, stripe_customer_id')
      .eq('email', 'luetzenburger.philipp@googlemail.com')
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('👤 User data after webhook:', {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      stripeCustomerId: userData.stripe_customer_id
    });

    if (userData.first_name === 'Phillipp' && userData.last_name === 'Lützenburger') {
      console.log('🎉 SUCCESS: User name was updated correctly!');
    } else {
      console.log('⚠️ User name was not updated as expected');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testCustomerUpdate();
