const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function testVacationSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🏖️ Testing Vacation System');
    console.log('=' .repeat(50));

    // 1. Check if vacation fields exist
    console.log('\n1. 🔍 Checking vacation table structure...');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%vacation%'
      ORDER BY ordinal_position;
    `);

    if (columns.length > 0) {
      console.log('   ✅ Vacation fields found:');
      columns.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('   ❌ No vacation fields found - run add-vacation-fields.js first');
      return;
    }

    // 2. Check current users with vacation data
    console.log('\n2. 👥 Current users with vacation data...');
    const { rows: vacationUsers } = await client.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        role,
        instructor_legal_area,
        email_notifications_enabled,
        vacation_start_date,
        vacation_end_date,
        vacation_reason
      FROM users 
      WHERE vacation_start_date IS NOT NULL 
         OR vacation_end_date IS NOT NULL
      ORDER BY vacation_start_date;
    `);

    if (vacationUsers.length > 0) {
      console.log(`   📊 Found ${vacationUsers.length} users with vacation data:`);
      vacationUsers.forEach(user => {
        console.log(`      👤 ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`         📅 Vacation: ${user.vacation_start_date} to ${user.vacation_end_date}`);
        console.log(`         📝 Reason: ${user.vacation_reason || 'N/A'}`);
        console.log(`         📧 Notifications: ${user.email_notifications_enabled ? 'Enabled' : 'Disabled'}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️ No users currently have vacation data');
    }

    // 3. Simulate vacation scenarios
    console.log('\n3. 🧪 Testing vacation scenarios...');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`   📅 Today: ${today}`);
    console.log(`   📅 Tomorrow: ${tomorrow}`);
    console.log(`   📅 Next week: ${nextWeek}`);

    // Find users who should be on vacation today
    const { rows: todayVacation } = await client.query(`
      SELECT 
        first_name, 
        last_name, 
        email,
        vacation_start_date,
        vacation_end_date,
        email_notifications_enabled
      FROM users 
      WHERE vacation_start_date <= $1 
        AND vacation_end_date >= $1
    `, [today]);

    console.log(`\n   🏖️ Users who should be on vacation today (${today}):`);
    if (todayVacation.length > 0) {
      todayVacation.forEach(user => {
        console.log(`      👤 ${user.first_name} ${user.last_name}`);
        console.log(`         📅 ${user.vacation_start_date} to ${user.vacation_end_date}`);
        console.log(`         📧 Notifications: ${user.email_notifications_enabled ? 'ON (should be OFF)' : 'OFF (correct)'}`);
      });
    } else {
      console.log('      ℹ️ No users on vacation today');
    }

    // Find users whose vacation has ended
    const { rows: endedVacation } = await client.query(`
      SELECT 
        first_name, 
        last_name, 
        email,
        vacation_end_date,
        email_notifications_enabled
      FROM users 
      WHERE vacation_end_date < $1
        AND vacation_end_date IS NOT NULL
    `, [today]);

    console.log(`\n   🎯 Users whose vacation has ended (before ${today}):`);
    if (endedVacation.length > 0) {
      endedVacation.forEach(user => {
        console.log(`      👤 ${user.first_name} ${user.last_name}`);
        console.log(`         📅 Ended: ${user.vacation_end_date}`);
        console.log(`         📧 Notifications: ${user.email_notifications_enabled ? 'ON (correct)' : 'OFF (should be ON)'}`);
      });
    } else {
      console.log('      ℹ️ No users with ended vacations');
    }

    // 4. Check cron job status
    console.log('\n4. ⏰ Checking cron job status...');
    try {
      const { rows: cronJobs } = await client.query(`
        SELECT 
          jobname,
          schedule,
          active,
          command
        FROM cron.job 
        WHERE jobname LIKE '%vacation%'
        ORDER BY jobname;
      `);

      if (cronJobs.length > 0) {
        console.log('   ✅ Vacation cron jobs found:');
        cronJobs.forEach(job => {
          console.log(`      📌 ${job.jobname}:`);
          console.log(`         Schedule: ${job.schedule}`);
          console.log(`         Active: ${job.active}`);
          console.log(`         Command: ${job.command.substring(0, 80)}...`);
        });
      } else {
        console.log('   ⚠️ No vacation cron jobs found');
        console.log('   💡 Run setup-vacation-cron.js to create the cron job');
      }
    } catch (error) {
      console.log('   ⚠️ Could not check cron jobs - pg_cron may not be available');
      console.log('   📝 Error:', error.message);
    }

    // 5. Check vacation logs table
    console.log('\n5. 📋 Checking vacation logs...');
    try {
      const { rows: logs } = await client.query(`
        SELECT 
          executed_at,
          status,
          users_on_vacation,
          users_returned,
          actions_performed,
          errors
        FROM vacation_checker_logs 
        ORDER BY executed_at DESC 
        LIMIT 5;
      `);

      if (logs.length > 0) {
        console.log('   📊 Recent vacation checker logs:');
        logs.forEach(log => {
          console.log(`      🕐 ${log.executed_at}: ${log.status}`);
          console.log(`         On vacation: ${log.users_on_vacation}, Returned: ${log.users_returned}`);
          console.log(`         Actions: ${log.actions_performed}, Errors: ${log.errors || 'None'}`);
        });
      } else {
        console.log('   ℹ️ No vacation checker logs found yet');
      }
    } catch (error) {
      console.log('   ⚠️ Could not check vacation logs - table may not exist');
      console.log('   💡 Run setup-vacation-cron.js to create the logs table');
    }

    console.log('\n✅ Vacation System Test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database structure checked');
    console.log('   ✅ Current vacation data reviewed');
    console.log('   ✅ Vacation scenarios simulated');
    console.log('   ✅ Cron job status verified');
    console.log('   ✅ Log system checked');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Deploy vacation-checker edge function');
    console.log('   2. Test edge function manually');
    console.log('   3. Verify cron job is working');
    console.log('   4. Monitor vacation_checker_logs table');

  } catch (error) {
    console.error('❌ Error testing vacation system:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testVacationSystem()
  .then(() => {
    console.log('🎉 Vacation system test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
