#!/usr/bin/env node

/**
 * Script to add federal_state column to case_study_requests table
 * This column stores the German federal state (Bundesland) for public law cases
 */

const { Client } = require('pg');

// Database connection string - use environment variable or default
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function addFederalStateColumn() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Add federal_state column to case_study_requests table
    const addColumnQuery = `
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS federal_state TEXT;
    `;

    console.log('📝 Adding federal_state column to case_study_requests table...');
    await client.query(addColumnQuery);

    // Add comment to document the column
    const addCommentQuery = `
      COMMENT ON COLUMN case_study_requests.federal_state 
      IS 'German federal state (Bundesland) for public law cases - required for Öffentliches Recht';
    `;

    console.log('📝 Adding column comment...');
    await client.query(addCommentQuery);

    console.log('✅ Successfully added federal_state column to case_study_requests table');
    console.log('📋 Column details:');
    console.log('   - Name: federal_state');
    console.log('   - Type: TEXT');
    console.log('   - Nullable: YES (only required for Öffentliches Recht)');
    console.log('   - Purpose: Store German federal state for public law cases');

  } catch (error) {
    console.error('❌ Error adding federal_state column:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addFederalStateColumn()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addFederalStateColumn };
