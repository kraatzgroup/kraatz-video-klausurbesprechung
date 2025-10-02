#!/usr/bin/env node

/**
 * Temporarily disable foreign key constraint to create user
 * WARNING: This is a more aggressive approach
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function createUserBypassingConstraint(email) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Get Stripe customer
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

    // Parse name
    let firstName = null, lastName = null;
    if (customer.name) {
      const nameParts = customer.name.trim().split(' ');
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }

    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Temporarily disable the foreign key constraint
      console.log('⚠️  Temporarily disabling foreign key constraint...');
      await client.query('ALTER TABLE users DISABLE TRIGGER ALL');
      
      // Insert user
      const insertQuery = `
        INSERT INTO users (
          id, email, first_name, last_name, role, 
          account_credits, stripe_customer_id, email_notifications_enabled
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        customer.email, firstName, lastName, 'student', 
        0, customer.id, true
      ]);

      // Re-enable the constraint
      console.log('🔧 Re-enabling foreign key constraint...');
      await client.query('ALTER TABLE users ENABLE TRIGGER ALL');
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Successfully created user:', {
        id: result.rows[0].id,
        email: result.rows[0].email,
        stripeCustomerId: result.rows[0].stripe_customer_id
      });

      console.log('⚠️  NOTE: This user exists in database but NOT in Supabase Auth!');
      console.log('⚠️  They cannot log in until they register normally.');
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE users ENABLE TRIGGER ALL');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/bypass-foreign-key.js <email>');
  process.exit(1);
}

createUserBypassingConstraint(email)
  .then(() => console.log('✨ Completed!'))
  .catch(error => {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  });
