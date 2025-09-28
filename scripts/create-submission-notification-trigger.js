#!/usr/bin/env node

/**
 * Create database trigger for automatic submission notifications
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function createSubmissionNotificationTrigger() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Create function to handle submission notifications
    console.log('🔧 Creating submission notification function...')
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_instructor_on_submission()
      RETURNS TRIGGER AS $$
      DECLARE
        instructor_record RECORD;
        student_record RECORD;
      BEGIN
        -- Only trigger on status change to 'submitted'
        IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
          
          -- Get student information
          SELECT first_name, last_name INTO student_record
          FROM users 
          WHERE id = NEW.user_id;
          
          -- Find instructor for this legal area
          SELECT id INTO instructor_record
          FROM users 
          WHERE role = 'instructor' 
          AND instructor_legal_area = NEW.legal_area
          AND email_notifications_enabled = true
          LIMIT 1;
          
          -- If no active instructor found, try springer
          IF instructor_record.id IS NULL THEN
            SELECT id INTO instructor_record
            FROM users 
            WHERE role = 'springer' 
            AND instructor_legal_area = NEW.legal_area
            AND email_notifications_enabled = true
            LIMIT 1;
          END IF;
          
          -- Create notification if instructor/springer found
          IF instructor_record.id IS NOT NULL AND student_record.first_name IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, type, related_case_study_id)
            VALUES (
              instructor_record.id,
              '📄 Neue Bearbeitung eingereicht',
              student_record.first_name || ' ' || student_record.last_name || ' hat eine Bearbeitung für ' || NEW.legal_area || ' - ' || NEW.sub_area || ' eingereicht.',
              'info',
              NEW.id
            );
            
            RAISE NOTICE 'Created submission notification for instructor % (case %)', instructor_record.id, NEW.id;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger
    console.log('🎯 Creating submission notification trigger...')
    await client.query(`
      DROP TRIGGER IF EXISTS submission_notification_trigger ON case_study_requests;
      
      CREATE TRIGGER submission_notification_trigger
        AFTER UPDATE ON case_study_requests
        FOR EACH ROW
        EXECUTE FUNCTION notify_instructor_on_submission();
    `)

    console.log('✅ Submission notification trigger created successfully!')
    
    // Test the trigger
    console.log('🧪 Testing trigger with a status update...')
    
    // Find a case study to test with
    const { rows: testCases } = await client.query(`
      SELECT id, status, legal_area, sub_area, user_id
      FROM case_study_requests 
      WHERE legal_area = 'Zivilrecht'
      ORDER BY updated_at DESC
      LIMIT 1
    `)
    
    if (testCases.length > 0) {
      const testCase = testCases[0]
      console.log(`Found test case: ${testCase.id} (current status: ${testCase.status})`)
      
      // Temporarily change status to trigger notification
      if (testCase.status === 'submitted') {
        // Change to materials_ready first, then back to submitted
        await client.query(`
          UPDATE case_study_requests 
          SET status = 'materials_ready', updated_at = NOW()
          WHERE id = $1
        `, [testCase.id])
        
        await client.query(`
          UPDATE case_study_requests 
          SET status = 'submitted', updated_at = NOW()
          WHERE id = $1
        `, [testCase.id])
        
        console.log('✅ Trigger test completed - check notifications table')
      }
    }

  } catch (error) {
    console.error('❌ Error creating submission notification trigger:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the creation
if (require.main === module) {
  createSubmissionNotificationTrigger()
    .then(() => {
      console.log('\n✅ Submission notification trigger setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Submission notification trigger setup failed:', error.message)
      process.exit(1)
    })
}

module.exports = { createSubmissionNotificationTrigger }
