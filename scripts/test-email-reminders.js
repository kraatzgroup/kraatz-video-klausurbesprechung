const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function testEmailReminders() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);

    // Check for pending reminders
    console.log('\n🔍 Checking for pending email reminders...');
    
    const pendingQuery = `
      SELECT 
        sf.id,
        sf.review_date,
        sf.email_reminder,
        sf.reminder_sent,
        sf.mistakes_learned,
        sf.improvements_planned,
        u.email,
        u.first_name,
        u.last_name,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area,
        csr.case_study_number
      FROM student_feedback sf
      JOIN users u ON sf.user_id = u.id
      JOIN case_study_requests csr ON sf.case_study_id = csr.id
      WHERE sf.review_date = $1 
      AND sf.email_reminder = true 
      AND sf.reminder_sent = false
      ORDER BY sf.created_at;
    `;

    const pendingResult = await client.query(pendingQuery, [today]);
    
    console.log(`📧 Found ${pendingResult.rows.length} pending reminders for today`);
    
    if (pendingResult.rows.length > 0) {
      console.log('\n📋 Pending reminders:');
      pendingResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.first_name} ${row.last_name} (${row.email})`);
        console.log(`   📚 ${row.legal_area} - ${row.sub_area}`);
        console.log(`   📅 Review Date: ${row.review_date}`);
        console.log(`   📧 Email Reminder: ${row.email_reminder}`);
        console.log(`   📤 Reminder Sent: ${row.reminder_sent}`);
      });
    }

    // Check all email reminders (not just today)
    console.log('\n🔍 Checking all active email reminders...');
    
    const allRemindersQuery = `
      SELECT 
        sf.review_date,
        COUNT(*) as count,
        SUM(CASE WHEN sf.reminder_sent THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN NOT sf.reminder_sent THEN 1 ELSE 0 END) as pending_count
      FROM student_feedback sf
      WHERE sf.email_reminder = true
      GROUP BY sf.review_date
      ORDER BY sf.review_date;
    `;

    const allRemindersResult = await client.query(allRemindersQuery);
    
    console.log(`\n📊 Email reminder statistics:`);
    console.log('Date\t\tTotal\tSent\tPending');
    console.log('----------------------------------------');
    
    allRemindersResult.rows.forEach(row => {
      console.log(`${row.review_date}\t${row.count}\t${row.sent_count}\t${row.pending_count}`);
    });

    // Check for overdue reminders
    console.log('\n⚠️ Checking for overdue reminders...');
    
    const overdueQuery = `
      SELECT 
        sf.review_date,
        COUNT(*) as count
      FROM student_feedback sf
      WHERE sf.review_date < $1 
      AND sf.email_reminder = true 
      AND sf.reminder_sent = false
      GROUP BY sf.review_date
      ORDER BY sf.review_date;
    `;

    const overdueResult = await client.query(overdueQuery, [today]);
    
    if (overdueResult.rows.length > 0) {
      console.log('📅 Overdue reminders found:');
      overdueResult.rows.forEach(row => {
        console.log(`   ${row.review_date}: ${row.count} reminder(s)`);
      });
    } else {
      console.log('✅ No overdue reminders found');
    }

    // Summary statistics
    console.log('\n📈 Summary Statistics:');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_feedbacks,
        SUM(CASE WHEN email_reminder THEN 1 ELSE 0 END) as with_email_reminder,
        SUM(CASE WHEN email_reminder AND reminder_sent THEN 1 ELSE 0 END) as reminders_sent,
        SUM(CASE WHEN email_reminder AND NOT reminder_sent THEN 1 ELSE 0 END) as reminders_pending
      FROM student_feedback;
    `;

    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`   Total Feedbacks: ${stats.total_feedbacks}`);
    console.log(`   With Email Reminder: ${stats.with_email_reminder}`);
    console.log(`   Reminders Sent: ${stats.reminders_sent}`);
    console.log(`   Reminders Pending: ${stats.reminders_pending}`);

  } catch (error) {
    console.error('❌ Error testing email reminders:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testEmailReminders()
  .then(() => {
    console.log('\n🎉 Email reminder test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Email reminder test failed:', error);
    process.exit(1);
  });
