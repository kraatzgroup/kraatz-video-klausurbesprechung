const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function testVacationSpringerFlow() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🏖️ Testing Vacation-Springer Flow');
    console.log('=' .repeat(60));

    // 1. Check current state of all instructors and springer
    console.log('\n1. 📊 Current state of all instructors and springer...');
    const { rows: allUsers } = await client.query(`
      SELECT 
        id,
        first_name, 
        last_name, 
        email, 
        role,
        instructor_legal_area,
        legal_areas,
        email_notifications_enabled,
        vacation_start_date,
        vacation_end_date,
        vacation_reason
      FROM users 
      WHERE role IN ('instructor', 'springer')
      ORDER BY role, instructor_legal_area, first_name;
    `);

    console.log(`   Found ${allUsers.length} instructors and springer:`);
    allUsers.forEach(user => {
      const legalAreas = user.legal_areas ? user.legal_areas.join(', ') : user.instructor_legal_area || 'N/A';
      const vacationStatus = user.vacation_start_date ? 
        `🏖️ Vacation: ${user.vacation_start_date} to ${user.vacation_end_date}` : 
        '✅ Available';
      
      console.log(`      👤 ${user.first_name} ${user.last_name} (${user.role})`);
      console.log(`         📧 ${user.email}`);
      console.log(`         ⚖️ Legal Areas: ${legalAreas}`);
      console.log(`         📬 Notifications: ${user.email_notifications_enabled ? '✅ ON' : '❌ OFF'}`);
      console.log(`         ${vacationStatus}`);
      console.log('');
    });

    // 2. Test notification logic for each legal area
    console.log('\n2. 🔍 Testing notification logic for each legal area...');
    const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht'];
    
    for (const area of legalAreas) {
      console.log(`\n   📚 Testing ${area}:`);
      
      // Find active instructors for this area
      const { rows: activeInstructors } = await client.query(`
        SELECT 
          first_name, 
          last_name, 
          email,
          role,
          instructor_legal_area,
          legal_areas,
          email_notifications_enabled,
          vacation_start_date,
          vacation_end_date
        FROM users 
        WHERE role = 'instructor'
          AND email_notifications_enabled = true
          AND (
            instructor_legal_area = $1 
            OR legal_areas @> ARRAY[$1]
          )
      `, [area]);

      console.log(`      👨‍🏫 Active instructors: ${activeInstructors.length}`);
      activeInstructors.forEach(instructor => {
        console.log(`         ✅ ${instructor.first_name} ${instructor.last_name} (${instructor.email})`);
      });

      // Find springer for this area
      const { rows: availableSpringer } = await client.query(`
        SELECT 
          first_name, 
          last_name, 
          email,
          role,
          instructor_legal_area,
          legal_areas,
          email_notifications_enabled
        FROM users 
        WHERE role = 'springer'
          AND email_notifications_enabled = true
          AND (
            instructor_legal_area = $1 
            OR legal_areas @> ARRAY[$1]
          )
      `, [area]);

      console.log(`      🔄 Available springer: ${availableSpringer.length}`);
      availableSpringer.forEach(springer => {
        console.log(`         🔄 ${springer.first_name} ${springer.last_name} (${springer.email})`);
      });

      // Determine who would receive notifications
      const recipients = activeInstructors.length > 0 ? activeInstructors : availableSpringer;
      const fallbackToSpringer = activeInstructors.length === 0 && availableSpringer.length > 0;

      console.log(`      📬 Notification recipients: ${recipients.length}`);
      if (fallbackToSpringer) {
        console.log(`      ⚠️ FALLBACK TO SPRINGER ACTIVATED - No active instructors!`);
      }
      recipients.forEach(recipient => {
        const icon = recipient.role === 'instructor' ? '👨‍🏫' : '🔄';
        console.log(`         ${icon} ${recipient.first_name} ${recipient.last_name} would receive notification`);
      });

      if (recipients.length === 0) {
        console.log(`      ❌ NO RECIPIENTS FOUND - Notifications would be lost!`);
      }
    }

    // 3. Simulate vacation scenarios
    console.log('\n3. 🧪 Simulating vacation scenarios...');
    
    // Get today's date for simulation
    const today = new Date().toISOString().split('T')[0];
    console.log(`   📅 Simulation date: ${today}`);

    // Scenario 1: Instructor goes on vacation
    console.log('\n   🏖️ Scenario 1: Instructor goes on vacation');
    console.log('   ─────────────────────────────────────────');
    
    const { rows: instructorsWithVacation } = await client.query(`
      SELECT 
        first_name, 
        last_name, 
        email,
        instructor_legal_area,
        legal_areas,
        vacation_start_date,
        vacation_end_date,
        email_notifications_enabled
      FROM users 
      WHERE role = 'instructor'
        AND vacation_start_date <= $1 
        AND vacation_end_date >= $1
    `, [today]);

    if (instructorsWithVacation.length > 0) {
      console.log(`   Found ${instructorsWithVacation.length} instructors on vacation today:`);
      instructorsWithVacation.forEach(instructor => {
        const areas = instructor.legal_areas ? instructor.legal_areas.join(', ') : instructor.instructor_legal_area;
        console.log(`      🏖️ ${instructor.first_name} ${instructor.last_name}`);
        console.log(`         Areas: ${areas}`);
        console.log(`         Vacation: ${instructor.vacation_start_date} to ${instructor.vacation_end_date}`);
        console.log(`         Notifications: ${instructor.email_notifications_enabled ? '⚠️ STILL ON (should be OFF)' : '✅ OFF (correct)'}`);
      });
    } else {
      console.log('   ℹ️ No instructors currently on vacation');
    }

    // 4. Check vacation checker logs
    console.log('\n4. 📋 Recent vacation checker activity...');
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
        LIMIT 3;
      `);

      if (logs.length > 0) {
        console.log('   Recent vacation checker runs:');
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
    }

    // 5. Summary and recommendations
    console.log('\n5. 📋 Summary and Recommendations');
    console.log('   ═══════════════════════════════════');

    // Check for potential issues
    const issues = [];
    const recommendations = [];

    // Check if there are instructors on vacation with notifications still enabled
    const vacationWithNotifications = instructorsWithVacation.filter(i => i.email_notifications_enabled);
    if (vacationWithNotifications.length > 0) {
      issues.push(`${vacationWithNotifications.length} instructors on vacation still have notifications enabled`);
      recommendations.push('Run vacation checker to disable notifications for vacation instructors');
    }

    // Check if all legal areas have coverage
    for (const area of legalAreas) {
      const { rows: coverage } = await client.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE (role = 'instructor' OR role = 'springer')
          AND email_notifications_enabled = true
          AND (
            instructor_legal_area = $1 
            OR legal_areas @> ARRAY[$1]
          )
      `, [area]);

      if (coverage[0].count === 0) {
        issues.push(`No coverage for ${area} - no active instructors or springer`);
        recommendations.push(`Assign springer for ${area} or ensure instructor notifications are enabled`);
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ All systems working correctly!');
      console.log('   ✅ Vacation-Springer flow is properly configured');
    } else {
      console.log('   ⚠️ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('\n   💡 Recommendations:');
      recommendations.forEach(rec => console.log(`      - ${rec}`));
    }

    console.log('\n✅ Vacation-Springer Flow Test completed!');

  } catch (error) {
    console.error('❌ Error testing vacation-springer flow:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testVacationSpringerFlow()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
