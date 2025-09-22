const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function addSpringerSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // 1. Add email_notifications_enabled column to users table
    console.log('📧 Adding email_notifications_enabled column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;
    `);

    // 2. Update the role CHECK constraint to include 'springer'
    console.log('🔄 Updating role constraint to include springer...');
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('student', 'instructor', 'admin', 'springer'));
    `);

    // 3. Update the instructor_legal_area constraint to allow springer role
    console.log('⚖️ Updating instructor_legal_area constraint...');
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_instructor_legal_area_check;
    `);
    
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_instructor_legal_area_check 
      CHECK (
        (role = 'instructor' AND instructor_legal_area IN ('Zivilrecht', 'Strafrecht', 'Öffentliches Recht')) OR
        (role = 'springer' AND instructor_legal_area IN ('Zivilrecht', 'Strafrecht', 'Öffentliches Recht')) OR
        (role IN ('student', 'admin') AND instructor_legal_area IS NULL)
      );
    `);

    // 4. Set default email notifications to true for existing users
    console.log('✅ Setting default email notifications for existing users...');
    await client.query(`
      UPDATE users 
      SET email_notifications_enabled = true 
      WHERE email_notifications_enabled IS NULL;
    `);

    console.log('✅ Springer system successfully added to database!');
    console.log('📋 Changes made:');
    console.log('   - Added email_notifications_enabled column (default: true)');
    console.log('   - Updated role constraint to include "springer"');
    console.log('   - Updated instructor_legal_area constraint for springer role');
    console.log('   - Set default email notifications for existing users');

  } catch (error) {
    console.error('❌ Error adding springer system:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addSpringerSystem()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
