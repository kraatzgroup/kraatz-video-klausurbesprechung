#!/usr/bin/env node

/**
 * Create user with Supabase Auth + Database entry
 * This bypasses the Foreign Key constraint by creating both auth and database user
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase Admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserWithStripeSync(email) {
  try {
    console.log(`🔍 Searching for Stripe customer: ${email}`);
    
    // Search for Stripe customer
    const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const searchResult = await response.json();
    
    if (searchResult.data.length === 0) {
      console.log('❌ No Stripe customer found with this email');
      return;
    }

    const customer = searchResult.data[0];
    console.log('✅ Found Stripe customer:', {
      id: customer.id,
      email: customer.email,
      name: customer.name
    });

    // Parse name
    let firstName = null;
    let lastName = null;
    if (customer.name) {
      const nameParts = customer.name.trim().split(' ');
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      console.log('👤 User already exists:', existingUser.id);
      
      // Update with Stripe customer ID if missing
      if (!existingUser.stripe_customer_id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('❌ Error updating user:', updateError);
        } else {
          console.log('✅ Updated user with Stripe customer ID');
        }
      }
      return;
    }

    // Create Auth user first
    console.log('👤 Creating Supabase Auth user...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        stripe_customer_id: customer.id
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Created auth user:', authUser.user.id);

    // Create database user
    console.log('📝 Creating database user...');
    
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id, // Use the same ID from auth.users
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'student',
        account_credits: 0,
        stripe_customer_id: customer.id,
        email_notifications_enabled: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error creating database user:', dbError);
      
      // Cleanup: Delete auth user if database creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log('🧹 Cleaned up auth user due to database error');
      return;
    }

    console.log('✅ Successfully created complete user:', {
      authId: authUser.user.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      stripeCustomerId: dbUser.stripe_customer_id
    });

    console.log('🎉 User creation completed successfully!');
    console.log('💡 The user can now log in with their email and a password they set.');

  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Email address is required');
  console.log('Usage: node scripts/create-user-with-auth.js <email>');
  console.log('Example: node scripts/create-user-with-auth.js philipp@luetzenburger.org');
  process.exit(1);
}

// Run the creation
createUserWithStripeSync(email)
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
