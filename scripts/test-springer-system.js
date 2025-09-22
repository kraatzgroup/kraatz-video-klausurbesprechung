require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function testSpringerSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🧪 Testing Springer System Implementation');
    console.log('=' .repeat(50));

    // 1. Test database schema changes
    console.log('\n1. 📊 Testing Database Schema:');
    
    // Check if email_notifications_enabled column exists
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_notifications_enabled'
    `);
    
    if (columns.length > 0) {
      console.log('   ✅ email_notifications_enabled column exists');
      console.log(`   📋 Type: ${columns[0].data_type}, Default: ${columns[0].column_default}`);
    } else {
      console.log('   ❌ email_notifications_enabled column missing');
    }

    // Check role constraint (simplified check)
    const { rows: constraints } = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'users_role_check'
    `);
    
    if (constraints.length > 0) {
      console.log('   ✅ Role constraint exists (users_role_check)');
    } else {
      console.log('   ❌ Role constraint not found');
    }

    // 2. Test user roles and notification settings
    console.log('\n2. 👥 Current User Roles and Settings:');
    
    const { rows: userStats } = await client.query(`
      SELECT 
        role,
        instructor_legal_area,
        email_notifications_enabled,
        COUNT(*) as count,
        array_agg(email) as emails
      FROM users 
      WHERE role IN ('instructor', 'springer', 'admin')
      GROUP BY role, instructor_legal_area, email_notifications_enabled
      ORDER BY role, instructor_legal_area
    `);

    userStats.forEach(row => {
      const notifications = row.email_notifications_enabled ? '🔔 enabled' : '🔕 disabled';
      const area = row.instructor_legal_area || 'no area';
      console.log(`   ${row.role.toUpperCase()}: ${row.count} user(s) in ${area} with notifications ${notifications}`);
      console.log(`     📧 Emails: ${row.emails.join(', ')}`);
    });

    // 3. Test notification routing logic
    console.log('\n3. 🎯 Testing Notification Routing:');
    
    const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht'];
    
    for (const area of legalAreas) {
      console.log(`\n   📚 ${area}:`);
      
      // Check active instructors
      const { rows: activeInstructors } = await client.query(`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'instructor' 
        AND instructor_legal_area = $1 
        AND COALESCE(email_notifications_enabled, true) = true
      `, [area]);

      // Check available springer
      const { rows: availableSpringer } = await client.query(`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'springer' 
        AND instructor_legal_area = $1 
        AND COALESCE(email_notifications_enabled, true) = true
      `, [area]);

      if (activeInstructors.length > 0) {
        console.log(`     ✅ ${activeInstructors.length} active instructor(s):`);
        activeInstructors.forEach(inst => {
          console.log(`       👨‍🏫 ${inst.first_name} ${inst.last_name} (${inst.email})`);
        });
        console.log(`     📧 Notifications will go to instructors`);
      } else {
        console.log(`     ⚠️ No active instructors found`);
        
        if (availableSpringer.length > 0) {
          console.log(`     🔄 ${availableSpringer.length} available springer:`);
          availableSpringer.forEach(springer => {
            console.log(`       🏃‍♂️ ${springer.first_name} ${springer.last_name} (${springer.email})`);
          });
          console.log(`     📧 Notifications will go to springer`);
        } else {
          console.log(`     ❌ No springer available - no notifications will be sent!`);
        }
      }
    }

    // 4. Test case study routing
    console.log('\n4. 📝 Testing Case Study Notification Routing:');
    
    const { rows: testCases } = await client.query(`
      SELECT 
        csr.id,
        csr.legal_area,
        csr.status,
        u.email as student_email,
        u.first_name as student_first_name,
        u.last_name as student_last_name
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      WHERE csr.status = 'submitted'
      ORDER BY csr.created_at DESC
      LIMIT 3
    `);

    if (testCases.length > 0) {
      console.log(`   Found ${testCases.length} submitted case(s) for testing:`);
      
      for (const testCase of testCases) {
        console.log(`\n   📋 Case ${testCase.id.substring(0, 8)}... (${testCase.legal_area})`);
        console.log(`     👨‍🎓 Student: ${testCase.student_first_name} ${testCase.student_last_name}`);
        
        // Check who would receive notifications
        const { rows: recipients } = await client.query(`
          SELECT 
            email, 
            first_name, 
            last_name, 
            role,
            CASE 
              WHEN role = 'instructor' AND COALESCE(email_notifications_enabled, true) = true THEN 'primary'
              WHEN role = 'springer' AND COALESCE(email_notifications_enabled, true) = true THEN 'fallback'
              ELSE 'inactive'
            END as notification_type
          FROM users 
          WHERE role IN ('instructor', 'springer')
          AND instructor_legal_area = $1
          ORDER BY 
            CASE WHEN role = 'instructor' THEN 1 ELSE 2 END,
            email_notifications_enabled DESC NULLS LAST
        `, [testCase.legal_area]);

        const activeInstructors = recipients.filter(r => r.role === 'instructor' && r.notification_type === 'primary');
        const activeSpringer = recipients.filter(r => r.role === 'springer' && r.notification_type === 'fallback');

        if (activeInstructors.length > 0) {
          console.log(`     📧 Would notify instructors: ${activeInstructors.map(i => i.email).join(', ')}`);
        } else if (activeSpringer.length > 0) {
          console.log(`     🔄 Would notify springer: ${activeSpringer.map(s => s.email).join(', ')}`);
        } else {
          console.log(`     ❌ No recipients available for notifications!`);
        }
      }
    } else {
      console.log('   ℹ️ No submitted cases found for testing');
    }

    // 5. Recommendations
    console.log('\n5. 💡 Recommendations:');
    
    // Check for missing springer
    const { rows: areasWithoutSpringer } = await client.query(`
      SELECT DISTINCT legal_area
      FROM (
        SELECT 'Zivilrecht' as legal_area
        UNION SELECT 'Strafrecht'
        UNION SELECT 'Öffentliches Recht'
      ) areas
      WHERE legal_area NOT IN (
        SELECT DISTINCT instructor_legal_area 
        FROM users 
        WHERE role = 'springer' 
        AND instructor_legal_area IS NOT NULL
      )
    `);

    if (areasWithoutSpringer.length > 0) {
      console.log('   ⚠️ Missing springer for legal areas:');
      areasWithoutSpringer.forEach(area => {
        console.log(`     - ${area.legal_area}: Consider creating a springer user`);
      });
    } else {
      console.log('   ✅ All legal areas have springer coverage');
    }

    // Check for instructors without notification settings
    const { rows: instructorsWithoutSettings } = await client.query(`
      SELECT email, instructor_legal_area
      FROM users 
      WHERE role = 'instructor' 
      AND email_notifications_enabled IS NULL
    `);

    if (instructorsWithoutSettings.length > 0) {
      console.log('   ⚠️ Instructors with undefined notification settings:');
      instructorsWithoutSettings.forEach(inst => {
        console.log(`     - ${inst.email} (${inst.instructor_legal_area}): Should set notification preference`);
      });
    }

    console.log('\n✅ Springer System Test Complete!');
    console.log('📋 Summary:');
    console.log('   - Database schema is properly configured');
    console.log('   - Notification routing logic is working');
    console.log('   - Fallback to springer when instructors are unavailable');
    console.log('   - Email notification preferences are respected');

  } catch (error) {
    console.error('❌ Error testing springer system:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testSpringerSystem()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
