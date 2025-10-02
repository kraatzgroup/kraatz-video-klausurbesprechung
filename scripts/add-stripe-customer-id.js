#!/usr/bin/env node

/**
 * Script to add stripe_customer_id column to users table
 * This enables automatic synchronization between Stripe customers and our database users
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function addStripeCustomerIdColumn() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Add stripe_customer_id column to users table
    const addColumnQuery = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
    `;

    console.log('📝 Adding stripe_customer_id column to users table...');
    await client.query(addColumnQuery);

    // Add index for performance
    const addIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
      ON users(stripe_customer_id);
    `;

    console.log('🔍 Adding index for stripe_customer_id...');
    await client.query(addIndexQuery);

    // Add comment for documentation
    const addCommentQuery = `
      COMMENT ON COLUMN users.stripe_customer_id IS 
      'Stripe customer ID for automatic synchronization between Stripe and database users';
    `;

    console.log('📋 Adding column documentation...');
    await client.query(addCommentQuery);

    console.log('✅ Successfully added stripe_customer_id column to users table');
    console.log('✅ Added unique constraint and index');
    console.log('✅ Added documentation comment');

  } catch (error) {
    console.error('❌ Error adding stripe_customer_id column:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addStripeCustomerIdColumn()
  .then(() => {
    console.log('🎉 Database schema update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
