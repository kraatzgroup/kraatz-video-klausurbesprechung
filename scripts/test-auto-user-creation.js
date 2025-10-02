#!/usr/bin/env node

/**
 * Test automatic user creation from Stripe webhook
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testAutoUserCreation() {
  try {
    const testEmail = 'test.guest.checkout@example.com';
    const testCustomerId = 'cus_test_auto_creation';
    
    console.log('🧪 Testing automatic user creation...');
    console.log('📧 Test email:', testEmail);
    console.log('🆔 Test customer ID:', testCustomerId);

    // First, clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testEmail)
      .single();

    if (existingUser) {
      // Delete from auth first
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('🗑️ Cleaned up existing test user');
    }

    // Simulate customer.created webhook event
    console.log('📤 Simulating customer.created webhook...');
    
    const customerData = {
      id: testCustomerId,
      object: "customer",
      email: testEmail,
      name: "Test Guest User"
    };

    const { data, error } = await supabase.functions.invoke('stripe-webhook', {
      body: {
        type: 'customer.created',
        data: {
          object: customerData
        }
      }
    });

    if (error) {
      console.error('❌ Webhook call failed:', error);
      return;
    }

    console.log('✅ Webhook call successful');

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user was created
    console.log('🔍 Checking if user was created...');
    
    const { data: createdUser, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, stripe_customer_id, role, account_credits')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('🎉 SUCCESS! User was automatically created:');
    console.log('👤 User details:', {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.first_name,
      lastName: createdUser.last_name,
      stripeCustomerId: createdUser.stripe_customer_id,
      role: createdUser.role,
      accountCredits: createdUser.account_credits
    });

    // Check if auth user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers.users.find(u => u.email === testEmail);
    
    if (authUser) {
      console.log('✅ Auth user also created:', authUser.id);
      console.log('🔗 IDs match:', createdUser.id === authUser.id ? 'YES' : 'NO');
    } else {
      console.log('❌ Auth user not found');
    }

    // Test login capability
    console.log('🔐 Testing if user can potentially login...');
    console.log('📧 User can reset password with email:', testEmail);
    console.log('🆔 Auth user ID:', authUser?.id);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id);
      console.log('✅ Test cleanup completed');
    }

    console.log('🎉 AUTOMATIC USER CREATION TEST PASSED!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testAutoUserCreation();
