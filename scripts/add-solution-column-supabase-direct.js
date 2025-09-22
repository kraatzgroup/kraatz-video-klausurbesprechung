const { Client } = require('pg');
require('dotenv').config();

// Supabase PostgreSQL direct connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })(),
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSolutionPdfColumn() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    console.log('Checking if solution_pdf_url column exists...');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'solution_pdf_url';
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Column solution_pdf_url already exists');
      return;
    }

    console.log('Adding solution_pdf_url column...');
    
    // Add the column
    const addColumnQuery = `
      ALTER TABLE case_study_requests 
      ADD COLUMN solution_pdf_url TEXT;
    `;

    await client.query(addColumnQuery);
    console.log('✅ Successfully added solution_pdf_url column to case_study_requests table');
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'solution_pdf_url';
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

addSolutionPdfColumn();
