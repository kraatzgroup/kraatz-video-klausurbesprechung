const { Client } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kraatz_club',
  user: 'charlenenowak',
  password: 'datenbankpasswort',
});

async function addSolutionPdfColumn() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    console.log('Adding solution_pdf_url column to case_study_requests table...');
    
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

    // Add the column
    const addColumnQuery = `
      ALTER TABLE case_study_requests 
      ADD COLUMN solution_pdf_url TEXT;
    `;

    await client.query(addColumnQuery);
    console.log('✅ Successfully added solution_pdf_url column to case_study_requests table');
    
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 PostgreSQL connection failed. Please ensure:');
      console.log('1. PostgreSQL is running');
      console.log('2. Database "kraatz_club" exists');
      console.log('3. User "postgres" has access');
      console.log('4. Password "datenbankpasswort" is correct');
    }
  } finally {
    await client.end();
    console.log('📝 Database connection closed');
  }
}

addSolutionPdfColumn();
