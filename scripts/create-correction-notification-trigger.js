#!/usr/bin/env node

/**
 * Create database trigger for automatic correction notifications
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function createCorrectionNotificationTrigger() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Create function to handle correction notifications
    console.log('🔧 Creating correction notification function...')
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_student_on_correction()
      RETURNS TRIGGER AS $$
      DECLARE
        student_record RECORD;
      BEGIN
        -- Check if correction URLs were added (video or written correction)
        IF (NEW.video_correction_url IS NOT NULL AND (OLD.video_correction_url IS NULL OR OLD.video_correction_url != NEW.video_correction_url))
           OR (NEW.written_correction_url IS NOT NULL AND (OLD.written_correction_url IS NULL OR OLD.written_correction_url != NEW.written_correction_url))
           OR (NEW.status = 'corrected' AND (OLD.status IS NULL OR OLD.status != 'corrected')) THEN
          
          -- Get student information
          SELECT first_name, last_name INTO student_record
          FROM users 
          WHERE id = NEW.user_id;
          
          -- Create notification for student
          IF student_record.first_name IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, type, related_case_study_id)
            VALUES (
              NEW.user_id,
              '🎓 Korrektur verfügbar',
              'Deine Korrektur für ' || NEW.legal_area || ' - ' || NEW.sub_area || ' ist jetzt verfügbar.',
              'success',
              NEW.id
            );
            
            RAISE NOTICE 'Created correction notification for student % (case %)', NEW.user_id, NEW.id;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger
    console.log('🎯 Creating correction notification trigger...')
    await client.query(`
      DROP TRIGGER IF EXISTS correction_notification_trigger ON case_study_requests;
      
      CREATE TRIGGER correction_notification_trigger
        AFTER UPDATE ON case_study_requests
        FOR EACH ROW
        EXECUTE FUNCTION notify_student_on_correction();
    `)

    console.log('✅ Correction notification trigger created successfully!')
    
    // Test the trigger by simulating a correction upload
    console.log('🧪 Testing trigger with a correction simulation...')
    
    // Find a case study to test with
    const { rows: testCases } = await client.query(`
      SELECT id, status, legal_area, sub_area, user_id, video_correction_url, written_correction_url
      FROM case_study_requests 
      WHERE user_id = (SELECT id FROM users WHERE email = 'charlenenowak@gmx.de')
      ORDER BY updated_at DESC
      LIMIT 1
    `)
    
    if (testCases.length > 0) {
      const testCase = testCases[0]
      console.log(`Found test case: ${testCase.id}`)
      console.log(`Current status: ${testCase.status}`)
      console.log(`Video correction: ${testCase.video_correction_url ? 'Available' : 'Not available'}`)
      console.log(`Written correction: ${testCase.written_correction_url ? 'Available' : 'Not available'}`)
      
      // Simulate adding a correction URL
      const testCorrectionUrl = `https://example.com/test-correction-${Date.now()}.mp4`
      
      await client.query(`
        UPDATE case_study_requests 
        SET 
          video_correction_url = $1,
          status = 'corrected',
          updated_at = NOW()
        WHERE id = $2
      `, [testCorrectionUrl, testCase.id])
      
      console.log('✅ Simulated correction upload - trigger should have fired')
      
      // Check if notification was created
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for trigger
      
      const { rows: newNotifications } = await client.query(`
        SELECT id, title, message, created_at
        FROM notifications 
        WHERE user_id = $1 
        AND title LIKE '%Korrektur verfügbar%'
        ORDER BY created_at DESC
        LIMIT 1
      `, [testCase.user_id])
      
      if (newNotifications.length > 0) {
        const notification = newNotifications[0]
        console.log(`✅ SUCCESS: Correction notification created!`)
        console.log(`   ID: ${notification.id}`)
        console.log(`   Title: ${notification.title}`)
        console.log(`   Message: ${notification.message}`)
        console.log(`   Created: ${notification.created_at}`)
      } else {
        console.log(`❌ ISSUE: No correction notification was created`)
      }
    }

  } catch (error) {
    console.error('❌ Error creating correction notification trigger:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the creation
if (require.main === module) {
  createCorrectionNotificationTrigger()
    .then(() => {
      console.log('\n✅ Correction notification trigger setup completed!')
      console.log('🎯 Students will now receive notifications when corrections are uploaded!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Correction notification trigger setup failed:', error.message)
      process.exit(1)
    })
}

module.exports = { createCorrectionNotificationTrigger }
