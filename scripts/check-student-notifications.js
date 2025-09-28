#!/usr/bin/env node

/**
 * Check student notifications for correction availability
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function checkStudentNotifications() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    console.log('🔍 Checking student notifications...')
    
    // Get Charlene's user ID
    const { rows: charleneUser } = await client.query(`
      SELECT id, email, first_name, last_name FROM users WHERE email = 'charlenenowak@gmx.de'
    `)
    
    if (charleneUser.length === 0) {
      throw new Error('User charlenenowak@gmx.de not found')
    }
    
    const user = charleneUser[0]
    console.log(`👤 User: ${user.first_name} ${user.last_name} (${user.email})`)
    
    // Get latest notifications
    const { rows: notifications } = await client.query(`
      SELECT id, title, message, created_at, read, type
      FROM notifications 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [user.id])
    
    console.log(`\n📋 Found ${notifications.length} notifications:`)
    notifications.forEach((n, index) => {
      console.log(`${index + 1}. ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Created: ${n.created_at}`)
      console.log(`   Status: ${n.read ? 'Read' : 'Unread'}`)
      console.log('')
    })
    
    // Check for correction notifications specifically
    const correctionNotifications = notifications.filter(n => 
      n.title.includes('Korrektur verfügbar') || 
      n.message.includes('Korrektur') ||
      n.title.includes('🎓')
    )
    
    console.log(`🎓 Correction notifications: ${correctionNotifications.length}`)
    correctionNotifications.forEach(n => {
      console.log(`- ${n.title}: ${n.message}`)
    })
    
    // Check case study status
    console.log(`\n📚 Case study status for this user:`)
    const { rows: caseStudies } = await client.query(`
      SELECT id, legal_area, sub_area, status, 
             video_correction_url, written_correction_url,
             updated_at
      FROM case_study_requests 
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 3
    `, [user.id])
    
    caseStudies.forEach(cs => {
      console.log(`- ${cs.legal_area} - ${cs.sub_area} (${cs.status})`)
      console.log(`  Video correction: ${cs.video_correction_url ? 'Available' : 'Not available'}`)
      console.log(`  Written correction: ${cs.written_correction_url ? 'Available' : 'Not available'}`)
      console.log(`  Updated: ${cs.updated_at}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error checking student notifications:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the check
if (require.main === module) {
  checkStudentNotifications()
    .then(() => {
      console.log('\n✅ Student notification check completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Student notification check failed:', error.message)
      process.exit(1)
    })
}

module.exports = { checkStudentNotifications }
