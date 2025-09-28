#!/usr/bin/env node

/**
 * Debug script to check instructor notifications
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function debugInstructorNotifications() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Find instructor users
    console.log('🔍 Finding instructor users...')
    const { rows: instructors } = await client.query(`
      SELECT id, email, first_name, last_name, role, instructor_legal_area
      FROM users 
      WHERE role IN ('instructor', 'springer')
      ORDER BY email
    `)
    
    console.log(`Found ${instructors.length} instructors/springer:`)
    instructors.forEach(i => {
      console.log(`- ${i.email}: ${i.first_name} ${i.last_name} (${i.role}, ${i.instructor_legal_area})`)
    })

    if (instructors.length > 0) {
      const instructor = instructors[0] // Take first instructor
      console.log(`\n🔔 Checking notifications for: ${instructor.email}`)
      
      // Get recent notifications for this instructor
      const { rows: notifications } = await client.query(`
        SELECT id, title, message, type, read, created_at, related_case_study_id
        FROM notifications 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [instructor.id])
      
      console.log(`\nFound ${notifications.length} notifications:`)
      notifications.forEach(n => {
        console.log(`\n📋 Notification ID: ${n.id}`)
        console.log(`   Title: ${n.title}`)
        console.log(`   Message: ${n.message}`)
        console.log(`   Type: ${n.type}`)
        console.log(`   Read: ${n.read}`)
        console.log(`   Created: ${n.created_at}`)
        console.log(`   Case Study ID: ${n.related_case_study_id}`)
      })

      // Check recent case study submissions
      console.log(`\n📚 Recent case study submissions for ${instructor.instructor_legal_area}:`)
      const { rows: submissions } = await client.query(`
        SELECT csr.id, csr.status, csr.legal_area, csr.sub_area, csr.updated_at,
               u.first_name, u.last_name, u.email
        FROM case_study_requests csr
        JOIN users u ON u.id = csr.user_id
        WHERE csr.legal_area = $1 
        AND csr.status IN ('submitted', 'under_review', 'corrected')
        ORDER BY csr.updated_at DESC
        LIMIT 5
      `, [instructor.instructor_legal_area])
      
      submissions.forEach(s => {
        console.log(`\n📄 Case Study: ${s.id}`)
        console.log(`   Student: ${s.first_name} ${s.last_name} (${s.email})`)
        console.log(`   Legal Area: ${s.legal_area} - ${s.sub_area}`)
        console.log(`   Status: ${s.status}`)
        console.log(`   Updated: ${s.updated_at}`)
      })

      // Create a test notification
      console.log(`\n🧪 Creating test notification for instructor...`)
      const { rows: testNotification } = await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_case_study_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `, [
        instructor.id,
        '📄 Test: Neue Bearbeitung eingereicht',
        'Test-Student hat eine Bearbeitung für Zivilrecht - BGB AT eingereicht.',
        'info',
        submissions.length > 0 ? submissions[0].id : null
      ])
      
      console.log(`✅ Test notification created with ID: ${testNotification[0].id}`)
      console.log(`📧 This should appear in the instructor's notification dropdown`)
    }

  } catch (error) {
    console.error('❌ Error debugging instructor notifications:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the debug
if (require.main === module) {
  debugInstructorNotifications()
    .then(() => {
      console.log('\n✅ Instructor notification debug completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Instructor notification debug failed:', error.message)
      process.exit(1)
    })
}

module.exports = { debugInstructorNotifications }
