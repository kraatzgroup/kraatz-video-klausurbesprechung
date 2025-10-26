const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function createTestUser() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create a test user directly in the database to trigger welcome email
    const testEmail = 'test-welcome@example.com';
    const testUserId = '12345678-1234-1234-1234-123456789012'; // UUID format

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [testEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log('🗑️ Deleting existing test user...');
      await client.query('DELETE FROM users WHERE email = $1', [testEmail]);
    }

    // Insert test user
    console.log('👤 Creating test user for welcome email...');
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name, role, instructor_legal_area, legal_areas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      testUserId,
      testEmail,
      'Test',
      'Welcome',
      'instructor',
      'Strafrecht',
      ['Strafrecht']
    ]);

    console.log('✅ Test user created successfully');
    console.log('📧 Now you can test the welcome email by calling the Edge Function with this user data');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();
