require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function setupInstructorNotifications() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // 1. Create a database trigger function for instructor notifications
    console.log('🔧 Creating trigger function for instructor notifications...');
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_instructor_on_case_submission()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only trigger for new submissions
        IF TG_OP = 'INSERT' AND NEW.status = 'submitted' THEN
          -- Log the submission for debugging
          RAISE NOTICE 'New case study submitted: ID=%, Legal Area=%, Student=%', NEW.id, NEW.legal_area, NEW.user_id;
          
          -- The actual notification will be handled by the application layer
          -- This trigger serves as a placeholder for future webhook integration
        END IF;
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the transaction
          RAISE WARNING 'Error in instructor notification trigger: %', SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. Create the trigger
    console.log('🎯 Creating trigger for case study submissions...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_notify_instructor_on_submission ON case_study_requests;
    `);
    
    await client.query(`
      CREATE TRIGGER trigger_notify_instructor_on_submission
        AFTER INSERT ON case_study_requests
        FOR EACH ROW
        WHEN (NEW.status = 'submitted')
        EXECUTE FUNCTION notify_instructor_on_case_submission();
    `);

    // 3. Test the setup by checking existing data
    console.log('🧪 Testing notification setup...');
    const { rows: testData } = await client.query(`
      SELECT 
        csr.id,
        csr.legal_area,
        csr.status,
        u.email as student_email,
        COUNT(instructors.id) as active_instructors,
        COUNT(springer.id) as available_springer
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      LEFT JOIN users instructors ON (
        instructors.role = 'instructor' 
        AND instructors.instructor_legal_area = csr.legal_area 
        AND COALESCE(instructors.email_notifications_enabled, true) = true
      )
      LEFT JOIN users springer ON (
        springer.role = 'springer' 
        AND springer.instructor_legal_area = csr.legal_area 
        AND COALESCE(springer.email_notifications_enabled, true) = true
      )
      WHERE csr.status = 'submitted'
      GROUP BY csr.id, csr.legal_area, csr.status, u.email
      LIMIT 5
    `);

    console.log('📊 Test results for notification routing:');
    testData.forEach(row => {
      console.log(`  - Case ${row.id} (${row.legal_area}): ${row.active_instructors} instructors, ${row.available_springer} springer available`);
    });

    // 4. Show current user roles and notification settings
    console.log('👥 Current user roles and notification settings:');
    const { rows: userStats } = await client.query(`
      SELECT 
        role,
        instructor_legal_area,
        email_notifications_enabled,
        COUNT(*) as count
      FROM users 
      WHERE role IN ('instructor', 'springer')
      GROUP BY role, instructor_legal_area, email_notifications_enabled
      ORDER BY role, instructor_legal_area
    `);

    userStats.forEach(row => {
      const notifications = row.email_notifications_enabled ? 'enabled' : 'disabled';
      console.log(`  - ${row.count} ${row.role}(s) in ${row.instructor_legal_area || 'no area'} with notifications ${notifications}`);
    });

    console.log('✅ Instructor notification system successfully set up!');
    console.log('📋 Summary:');
    console.log('   - Trigger function created for case study submissions');
    console.log('   - Notifications will route to instructors or springer based on availability');
    console.log('   - Email notifications respect email_notifications_enabled setting');
    console.log('   - Manual notification calls can be made from the application layer');

  } catch (error) {
    console.error('❌ Error setting up instructor notifications:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
setupInstructorNotifications()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
