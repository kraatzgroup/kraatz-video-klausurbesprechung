const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function testCaseTransferSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🔄 Testing Case Transfer System');
    console.log('=' .repeat(60));

    // 1. Check if assignment fields exist
    console.log('\n1. 🔍 Checking case assignment table structure...');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND (column_name LIKE '%assign%' OR column_name LIKE '%instructor%')
      ORDER BY ordinal_position;
    `);

    if (columns.length > 0) {
      console.log('   ✅ Assignment fields found:');
      columns.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('   ❌ No assignment fields found - run add-case-assignment-fields.js first');
      return;
    }

    // 2. Check current case distribution
    console.log('\n2. 📊 Current case distribution by status and legal area...');
    const { rows: caseStats } = await client.query(`
      SELECT 
        legal_area,
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN assigned_instructor_id IS NOT NULL THEN 1 END) as assigned_count
      FROM case_study_requests 
      GROUP BY legal_area, status
      ORDER BY legal_area, status;
    `);

    console.log('   Status distribution:');
    caseStats.forEach(stat => {
      console.log(`      ${stat.legal_area} - ${stat.status}: ${stat.count} total (${stat.assigned_count} assigned)`);
    });

    // 3. Check instructors and their potential cases
    console.log('\n3. 👨‍🏫 Instructors and their assignable cases...');
    const { rows: instructors } = await client.query(`
      SELECT 
        u.id,
        u.first_name, 
        u.last_name, 
        u.email,
        u.instructor_legal_area,
        u.legal_areas,
        u.email_notifications_enabled,
        u.vacation_start_date,
        u.vacation_end_date
      FROM users u
      WHERE u.role = 'instructor'
      ORDER BY u.first_name;
    `);

    for (const instructor of instructors) {
      const legalAreas = instructor.legal_areas || 
        (instructor.instructor_legal_area ? [instructor.instructor_legal_area] : []);
      
      console.log(`\n   👤 ${instructor.first_name} ${instructor.last_name}`);
      console.log(`      📧 ${instructor.email}`);
      console.log(`      ⚖️ Legal Areas: ${legalAreas.join(', ') || 'None'}`);
      console.log(`      📬 Notifications: ${instructor.email_notifications_enabled ? '✅ ON' : '❌ OFF'}`);
      
      if (instructor.vacation_start_date) {
        console.log(`      🏖️ Vacation: ${instructor.vacation_start_date} to ${instructor.vacation_end_date}`);
      }

      // Check assignable cases for each legal area
      for (const area of legalAreas) {
        const { rows: assignableCases } = await client.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM case_study_requests 
          WHERE legal_area = $1
            AND status IN (
              'sachverhalt_angefordert',
              'sachverhalt_eingereicht', 
              'in_bearbeitung',
              'korrektur_bereit',
              'video_angefordert'
            )
          GROUP BY status
          ORDER BY status;
        `, [area]);

        if (assignableCases.length > 0) {
          console.log(`      📋 Assignable cases in ${area}:`);
          assignableCases.forEach(caseType => {
            console.log(`         - ${caseType.status}: ${caseType.count}`);
          });
        } else {
          console.log(`      📋 No assignable cases in ${area}`);
        }

        // Check currently assigned cases
        const { rows: assignedCases } = await client.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM case_study_requests 
          WHERE legal_area = $1
            AND assigned_instructor_id = $2
          GROUP BY status
          ORDER BY status;
        `, [area, instructor.id]);

        if (assignedCases.length > 0) {
          console.log(`      📌 Currently assigned cases in ${area}:`);
          assignedCases.forEach(caseType => {
            console.log(`         - ${caseType.status}: ${caseType.count}`);
          });
        }
      }
    }

    // 4. Check springer coverage
    console.log('\n4. 🔄 Springer coverage...');
    const { rows: springers } = await client.query(`
      SELECT 
        u.id,
        u.first_name, 
        u.last_name, 
        u.email,
        u.instructor_legal_area,
        u.legal_areas,
        u.email_notifications_enabled
      FROM users u
      WHERE u.role = 'springer'
      ORDER BY u.first_name;
    `);

    if (springers.length > 0) {
      springers.forEach(springer => {
        const legalAreas = springer.legal_areas || 
          (springer.instructor_legal_area ? [springer.instructor_legal_area] : []);
        
        console.log(`   🔄 ${springer.first_name} ${springer.last_name}`);
        console.log(`      📧 ${springer.email}`);
        console.log(`      ⚖️ Legal Areas: ${legalAreas.join(', ') || 'None'}`);
        console.log(`      📬 Notifications: ${springer.email_notifications_enabled ? '✅ ON' : '❌ OFF'}`);
      });
    } else {
      console.log('   ⚠️ No springer found');
    }

    // 5. Simulate transfer scenarios
    console.log('\n5. 🧪 Transfer scenario simulation...');
    
    // Find instructor with cases that could be transferred
    const { rows: transferCandidates } = await client.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.instructor_legal_area,
        u.legal_areas,
        COUNT(csr.id) as open_cases
      FROM users u
      LEFT JOIN case_study_requests csr ON (
        csr.legal_area = u.instructor_legal_area 
        OR (u.legal_areas IS NOT NULL AND csr.legal_area = ANY(u.legal_areas))
      )
      AND csr.status IN (
        'sachverhalt_angefordert',
        'sachverhalt_eingereicht', 
        'in_bearbeitung',
        'korrektur_bereit',
        'video_angefordert'
      )
      WHERE u.role = 'instructor'
      GROUP BY u.id, u.first_name, u.last_name, u.instructor_legal_area, u.legal_areas
      HAVING COUNT(csr.id) > 0
      ORDER BY COUNT(csr.id) DESC
      LIMIT 3;
    `);

    if (transferCandidates.length > 0) {
      console.log('   📋 Instructors with transferable cases:');
      transferCandidates.forEach(candidate => {
        const areas = candidate.legal_areas || 
          (candidate.instructor_legal_area ? [candidate.instructor_legal_area] : []);
        console.log(`      👤 ${candidate.first_name} ${candidate.last_name}: ${candidate.open_cases} open cases`);
        console.log(`         Areas: ${areas.join(', ')}`);
      });
    } else {
      console.log('   ℹ️ No instructors with transferable cases found');
    }

    // 6. Check for transfer history
    console.log('\n6. 📚 Case transfer history...');
    const { rows: transferHistory } = await client.query(`
      SELECT 
        csr.id,
        csr.legal_area,
        csr.status,
        csr.assignment_date,
        csr.assignment_reason,
        current_instructor.first_name || ' ' || current_instructor.last_name as current_instructor,
        previous_instructor.first_name || ' ' || previous_instructor.last_name as previous_instructor
      FROM case_study_requests csr
      LEFT JOIN users current_instructor ON csr.assigned_instructor_id = current_instructor.id
      LEFT JOIN users previous_instructor ON csr.previous_instructor_id = previous_instructor.id
      WHERE csr.assignment_date IS NOT NULL
      ORDER BY csr.assignment_date DESC
      LIMIT 10;
    `);

    if (transferHistory.length > 0) {
      console.log('   Recent case transfers:');
      transferHistory.forEach(transfer => {
        console.log(`      📋 Case ${transfer.id} (${transfer.legal_area})`);
        console.log(`         Status: ${transfer.status}`);
        console.log(`         Assigned to: ${transfer.current_instructor || 'None'}`);
        console.log(`         Previous: ${transfer.previous_instructor || 'None'}`);
        console.log(`         Date: ${transfer.assignment_date}`);
        console.log(`         Reason: ${transfer.assignment_reason || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️ No transfer history found');
    }

    // 7. Summary and recommendations
    console.log('\n7. 📋 Summary and Recommendations');
    console.log('   ═══════════════════════════════════');

    const issues = [];
    const recommendations = [];

    // Check for instructors on vacation with unassigned cases
    const vacationInstructors = instructors.filter(i => 
      i.vacation_start_date && !i.email_notifications_enabled
    );

    if (vacationInstructors.length > 0) {
      console.log('   🏖️ Instructors currently on vacation:');
      vacationInstructors.forEach(instructor => {
        console.log(`      - ${instructor.first_name} ${instructor.last_name}`);
      });
    }

    // Check springer coverage for each legal area
    const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht'];
    for (const area of legalAreas) {
      const areaSpringers = springers.filter(s => {
        const areas = s.legal_areas || (s.instructor_legal_area ? [s.instructor_legal_area] : []);
        return areas.includes(area) && s.email_notifications_enabled;
      });

      if (areaSpringers.length === 0) {
        issues.push(`No active springer coverage for ${area}`);
        recommendations.push(`Assign springer for ${area} to handle vacation transfers`);
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ Case transfer system is ready!');
      console.log('   ✅ All legal areas have springer coverage');
      console.log('   ✅ Transfer infrastructure is in place');
    } else {
      console.log('   ⚠️ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('\n   💡 Recommendations:');
      recommendations.forEach(rec => console.log(`      - ${rec}`));
    }

    console.log('\n✅ Case Transfer System Test completed!');

  } catch (error) {
    console.error('❌ Error testing case transfer system:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testCaseTransferSystem()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
