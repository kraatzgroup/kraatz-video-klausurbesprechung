const { Client } = require('pg');
require('dotenv').config();

// Supabase PostgreSQL direct connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function assignInstructorLegalArea() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    // Assign Zivilrecht to existing instructor
    console.log('Assigning Zivilrecht to dozent@kraatz-club.de...');
    
    const assignQuery = `
      UPDATE users 
      SET instructor_legal_area = 'Zivilrecht' 
      WHERE email = 'dozent@kraatz-club.de' AND role = 'instructor';
    `;

    const result = await client.query(assignQuery);
    console.log('✅ Successfully assigned Zivilrecht to Prof. Kraatz');
    
    // Verify the assignment
    const verifyQuery = `
      SELECT id, email, first_name, last_name, role, instructor_legal_area
      FROM users 
      WHERE email = 'dozent@kraatz-club.de';
    `;
    
    const verification = await client.query(verifyQuery);
    if (verification.rows.length > 0) {
      const user = verification.rows[0];
      console.log(`✅ Verification: ${user.first_name} ${user.last_name} (${user.email}) - Legal Area: ${user.instructor_legal_area}`);
    }

    console.log('\n📝 To create additional instructors for other legal areas:');
    console.log('1. Create instructor accounts via admin panel or registration');
    console.log('2. Assign legal areas:');
    console.log('   - Strafrecht: UPDATE users SET instructor_legal_area = \'Strafrecht\' WHERE email = \'strafrecht@kraatz-club.de\';');
    console.log('   - Öffentliches Recht: UPDATE users SET instructor_legal_area = \'Öffentliches Recht\' WHERE email = \'oeffentlich@kraatz-club.de\';');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('📝 Database connection closed');
  }
}

assignInstructorLegalArea();
