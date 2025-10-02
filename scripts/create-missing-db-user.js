#!/usr/bin/env node

/**
 * Create missing database user for existing auth user
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createMissingDbUser(email) {
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
    console.log('✅ Found Stripe customer:', customer.id);

    // Find auth user
    console.log('🔍 Searching for auth user...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }

    const authUser = authUsers.users.find(user => user.email === email);
    if (!authUser) {
      console.error('❌ Auth user not found');
      return;
    }

    console.log('✅ Found auth user:', {
      id: authUser.id,
      email: authUser.email,
      created: authUser.created_at
    });

    // Check if database user exists
    const { data: existingDbUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingDbUser && !checkError) {
      console.log('ℹ️ Database user already exists');
      
      // Update with Stripe customer ID if missing
      if (!existingDbUser.stripe_customer_id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('id', authUser.id);

        if (!updateError) {
          console.log('✅ Updated existing user with Stripe customer ID');
        }
      }
      return;
    }

    // Parse name from Stripe
    let firstName = null, lastName = null;
    if (customer.name) {
      const nameParts = customer.name.trim().split(' ');
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }

    // Create database user
    console.log('👤 Creating missing database user...');
    const { data: newDbUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUser.id, // Use same ID as auth user
        email: authUser.email,
        first_name: firstName,
        last_name: lastName,
        role: 'student',
        account_credits: 0,
        stripe_customer_id: customer.id,
        email_notifications_enabled: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating database user:', createError);
      return;
    }

    console.log('✅ Successfully created database user:', {
      id: newDbUser.id,
      email: newDbUser.email,
      firstName: newDbUser.first_name,
      lastName: newDbUser.last_name,
      stripeCustomerId: newDbUser.stripe_customer_id
    });

    console.log('🎉 User synchronization completed successfully!');
    console.log('💡 Philipp can now use all platform features with Stripe integration.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/create-missing-db-user.js <email>');
  process.exit(1);
}

createMissingDbUser(email)
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
