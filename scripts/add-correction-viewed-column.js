const { Client } = require('pg');
require('dotenv').config();

// Supabase PostgreSQL direct connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addCorrectionViewedColumn() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    console.log('Checking if correction_viewed_at column exists...');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'correction_viewed_at';
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Column correction_viewed_at already exists');
      return;
    }

    console.log('Adding correction_viewed_at column...');
    
    // Add the column
    const addColumnQuery = `
      ALTER TABLE case_study_requests 
      ADD COLUMN correction_viewed_at TIMESTAMP;
    `;

    await client.query(addColumnQuery);
    console.log('✅ Successfully added correction_viewed_at column to case_study_requests table');
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'correction_viewed_at';
    `;
    
    const verification = await client.query(verifyQuery);
    if (verification.rows.length > 0) {
      console.log('✅ Verification successful - column exists with type:', verification.rows[0].data_type);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🔧 DNS resolution failed. Check internet connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Connection refused. Check connection string and credentials.');
    } else if (error.message.includes('already exists')) {
      console.log('✅ Column already exists (expected error)');
    }
  } finally {
    await client.end();
    console.log('📝 Database connection closed');
  }
}

addCorrectionViewedColumn();
