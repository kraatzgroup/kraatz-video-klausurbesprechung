#!/usr/bin/env node

/**
 * Link existing user to Stripe customer
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function linkUserToStripe(email) {
  try {
    // Get Stripe customer
    console.log(`🔍 Searching for Stripe customer: ${email}`);
    const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
    });

    const searchResult = await response.json();
    if (searchResult.data.length === 0) {
      console.log('❌ No Stripe customer found');
      return;
    }

    const customer = searchResult.data[0];
    console.log('✅ Found Stripe customer:', {
      id: customer.id,
      email: customer.email,
      name: customer.name
    });

    // Find existing user in database
    console.log('👤 Searching for existing user in database...');
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError) {
      console.error('❌ User not found in database:', findError);
      return;
    }

    console.log('✅ Found existing user:', {
      id: existingUser.id,
      email: existingUser.email,
      currentStripeId: existingUser.stripe_customer_id
    });

    // Update user with Stripe customer ID
    if (existingUser.stripe_customer_id) {
      console.log('ℹ️ User already has Stripe customer ID:', existingUser.stripe_customer_id);
      
      if (existingUser.stripe_customer_id === customer.id) {
        console.log('✅ Stripe customer ID already matches - no update needed');
        return;
      } else {
        console.log('⚠️ Different Stripe customer ID found - updating...');
      }
    }

    console.log('🔄 Updating user with Stripe customer ID...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        stripe_customer_id: customer.id,
        // Also update name if available from Stripe
        first_name: customer.name ? customer.name.split(' ')[0] : existingUser.first_name,
        last_name: customer.name && customer.name.split(' ').length > 1 
          ? customer.name.split(' ').slice(1).join(' ') 
          : existingUser.last_name
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ Successfully linked user to Stripe customer:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      stripeCustomerId: updatedUser.stripe_customer_id,
      accountCredits: updatedUser.account_credits
    });

    console.log('🎉 User-Stripe synchronization completed successfully!');
    console.log('💡 The user can now make payments and the system will automatically sync.');

  } catch (error) {
    console.error('❌ Error linking user to Stripe:', error);
    throw error;
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/link-existing-user-stripe.js <email>');
  process.exit(1);
}

linkUserToStripe(email)
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
