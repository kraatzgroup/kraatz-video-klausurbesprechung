#!/usr/bin/env node

/**
 * Script to sync a specific Stripe customer to our database
 * Searches for customer by email and creates/updates user in our database
 */

const { Client } = require('pg');

// Database connection
const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('💡 Set it with: export STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

async function syncStripeCustomer(email) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Search for Stripe customer by email
    console.log(`🔍 Searching for Stripe customer: ${email}`);
    
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
      name: customer.name,
      created: new Date(customer.created * 1000).toISOString()
    });

    // Parse name into first_name and last_name
    let firstName = null;
    let lastName = null;

    if (customer.name) {
      const nameParts = customer.name.trim().split(' ');
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }

    console.log('📝 Parsed name:', { firstName, lastName });

    // Check if user already exists in our database
    const checkUserQuery = `
      SELECT id, email, stripe_customer_id 
      FROM users 
      WHERE email = $1 OR stripe_customer_id = $2
    `;
    
    const existingUser = await client.query(checkUserQuery, [customer.email, customer.id]);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log('👤 User already exists:', {
        userId: user.id,
        email: user.email,
        stripeCustomerId: user.stripe_customer_id
      });

      // Update user with Stripe customer ID if missing
      if (!user.stripe_customer_id) {
        console.log('🔄 Updating user with Stripe customer ID...');
        
        const updateQuery = `
          UPDATE users 
          SET stripe_customer_id = $1,
              first_name = COALESCE($2, first_name),
              last_name = COALESCE($3, last_name)
          WHERE id = $4
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          customer.id,
          firstName,
          lastName,
          user.id
        ]);

        console.log('✅ Successfully updated existing user:', updateResult.rows[0]);
      } else {
        console.log('ℹ️ User already has Stripe customer ID, no update needed');
      }
    } else {
      // Create new user
      console.log('👤 Creating new user from Stripe customer...');
      console.log('⚠️  Note: This creates a database user without Supabase Auth.');
      console.log('⚠️  The user will need to sign up through the normal registration process.');
      
      // Generate a UUID for the user
      const { rows: uuidRows } = await client.query('SELECT gen_random_uuid() as id');
      const userId = uuidRows[0].id;
      
      const insertQuery = `
        INSERT INTO users (
          id,
          email,
          first_name,
          last_name,
          role,
          account_credits,
          stripe_customer_id,
          email_notifications_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const insertResult = await client.query(insertQuery, [
        userId,
        customer.email,
        firstName,
        lastName,
        'student', // Default role
        0, // Start with 0 credits
        customer.id,
        true // Default to enabled notifications
      ]);

      console.log('✅ Successfully created new user:', {
        userId: insertResult.rows[0].id,
        email: insertResult.rows[0].email,
        firstName: insertResult.rows[0].first_name,
        lastName: insertResult.rows[0].last_name,
        role: insertResult.rows[0].role,
        stripeCustomerId: insertResult.rows[0].stripe_customer_id
      });
    }

    console.log('🎉 Stripe customer sync completed successfully!');

  } catch (error) {
    console.error('❌ Error syncing Stripe customer:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Email address is required');
  console.log('Usage: node scripts/sync-stripe-customer.js <email>');
  console.log('Example: node scripts/sync-stripe-customer.js philipp@luetzenburger.org');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

// Run the sync
syncStripeCustomer(email)
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
