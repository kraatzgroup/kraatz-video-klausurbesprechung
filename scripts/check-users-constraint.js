const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function checkConstraint() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check the constraint definition
    const constraintQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'users_legal_areas_check';
    `;
    
    const constraintResult = await client.query(constraintQuery);
    console.log('\n📋 Constraint Definition:');
    console.log(constraintResult.rows);

    // Check if the user already exists
    const userQuery = `
      SELECT id, email, role, instructor_legal_area, legal_areas 
      FROM users 
      WHERE email = 'yoshikorural@tiffincrane.com';
    `;
    
    const userResult = await client.query(userQuery);
    console.log('\n👤 Existing User Check:');
    console.log(userResult.rows);

    // Check the table structure
    const tableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('instructor_legal_area', 'legal_areas', 'role');
    `;
    
    const tableResult = await client.query(tableQuery);
    console.log('\n🏗️ Table Structure:');
    console.log(tableResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkConstraint();
