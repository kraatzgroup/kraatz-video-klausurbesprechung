const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function addEmailReminderColumn() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Add email_reminder column to student_feedback table
    console.log('📧 Adding email_reminder column to student_feedback table...');
    
    await client.query(`
      ALTER TABLE student_feedback 
      ADD COLUMN IF NOT EXISTS email_reminder BOOLEAN DEFAULT false;
    `);
    
    console.log('✅ email_reminder column added successfully');

    // Add reminder_sent column to track if reminder was already sent
    console.log('📤 Adding reminder_sent column to student_feedback table...');
    
    await client.query(`
      ALTER TABLE student_feedback 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
    `);
    
    console.log('✅ reminder_sent column added successfully');

    // Add index for efficient querying of pending reminders
    console.log('🔍 Adding index for reminder queries...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_feedback_reminders 
      ON student_feedback (review_date, email_reminder, reminder_sent) 
      WHERE email_reminder = true AND reminder_sent = false;
    `);
    
    console.log('✅ Index created successfully');

    // Add comment to document the columns
    await client.query(`
      COMMENT ON COLUMN student_feedback.email_reminder IS 'Whether student wants email reminder on review date';
    `);
    
    await client.query(`
      COMMENT ON COLUMN student_feedback.reminder_sent IS 'Whether email reminder has been sent';
    `);
    
    console.log('📝 Column comments added');

  } catch (error) {
    console.error('❌ Error adding email reminder columns:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
addEmailReminderColumn()
  .then(() => {
    console.log('🎉 Email reminder columns migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
