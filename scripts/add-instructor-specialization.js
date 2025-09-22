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

async function addInstructorSpecialization() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    console.log('Checking if instructor_legal_area column exists...');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'instructor_legal_area';
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Column instructor_legal_area already exists');
    } else {
      console.log('Adding instructor_legal_area column...');
      
      // Add the column with enum constraint
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN instructor_legal_area TEXT 
        CHECK (instructor_legal_area IN ('Zivilrecht', 'Strafrecht', 'Öffentliches Recht'));
      `;

      await client.query(addColumnQuery);
      console.log('✅ Successfully added instructor_legal_area column to users table');
    }
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'instructor_legal_area';
    `;
    
    const verification = await client.query(verifyQuery);
    if (verification.rows.length > 0) {
      console.log('✅ Verification successful - column exists with type:', verification.rows[0].data_type);
    }

    // Show current users with instructor role
    console.log('\nCurrent instructors in database:');
    const instructorsQuery = `
      SELECT id, email, first_name, last_name, role, instructor_legal_area
      FROM users 
      WHERE role = 'instructor'
      ORDER BY email;
    `;
    
    const instructors = await client.query(instructorsQuery);
    if (instructors.rows.length > 0) {
      console.log('Found instructors:');
      instructors.rows.forEach(instructor => {
        console.log(`- ${instructor.email} (${instructor.first_name} ${instructor.last_name}) - Legal Area: ${instructor.instructor_legal_area || 'Not set'}`);
      });
      
      console.log('\n📝 To assign legal areas to instructors, run:');
      console.log('UPDATE users SET instructor_legal_area = \'Zivilrecht\' WHERE email = \'instructor@example.com\';');
      console.log('UPDATE users SET instructor_legal_area = \'Strafrecht\' WHERE email = \'instructor2@example.com\';');
      console.log('UPDATE users SET instructor_legal_area = \'Öffentliches Recht\' WHERE email = \'instructor3@example.com\';');
    } else {
      console.log('No instructors found in database');
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

addInstructorSpecialization();
