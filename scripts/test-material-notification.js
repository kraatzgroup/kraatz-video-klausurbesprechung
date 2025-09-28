#!/usr/bin/env node

/**
 * Test script to verify that material notifications trigger email sending
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function testMaterialNotification() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Find charlenenowak@gmx.de user
    console.log('🔍 Finding user charlenenowak@gmx.de...')
    const { rows: users } = await client.query(`
      SELECT id, email, first_name, last_name, role
      FROM users 
      WHERE email = 'charlenenowak@gmx.de'
      LIMIT 1
    `)
    
    if (users.length === 0) {
      throw new Error('User charlenenowak@gmx.de not found!')
    }
    
    const user = users[0]
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`)

    // Find a case study for this user
    console.log('🔍 Finding case studies for this user...')
    const { rows: caseStudies } = await client.query(`
      SELECT id, legal_area, sub_area, status, case_study_material_url
      FROM case_study_requests 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 3
    `, [user.id])
    
    console.log(`Found ${caseStudies.length} case studies:`)
    caseStudies.forEach(cs => {
      console.log(`- ${cs.id}: ${cs.legal_area} - ${cs.sub_area} (${cs.status})`)
      console.log(`  Material URL: ${cs.case_study_material_url ? 'Available' : 'Not available'}`)
    })

    if (caseStudies.length > 0) {
      const testCase = caseStudies[0]
      
      console.log('\n🧪 Creating test notification for material availability...')
      
      // Create a test notification
      const { rows: notification } = await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_case_study_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `, [
        user.id,
        '📚 Sachverhalt verfügbar',
        `Dein Sachverhalt für ${testCase.legal_area} - ${testCase.sub_area} ist jetzt verfügbar. Du kannst mit der Bearbeitung beginnen.`,
        'info',
        testCase.id
      ])
      
      console.log(`✅ Test notification created with ID: ${notification[0].id}`)
      console.log(`📧 This should trigger an email to: ${user.email}`)
      console.log(`⏰ Created at: ${notification[0].created_at}`)
      
      console.log('\n📋 Notification details:')
      console.log(`- Title: 📚 Sachverhalt verfügbar`)
      console.log(`- Message: Dein Sachverhalt für ${testCase.legal_area} - ${testCase.sub_area} ist jetzt verfügbar. Du kannst mit der Bearbeitung beginnen.`)
      console.log(`- Type: info`)
      console.log(`- Related Case Study: ${testCase.id}`)
      
      console.log('\n🔔 The Edge Function should automatically:')
      console.log('1. Detect this as a student notification (contains "verfügbar")')
      console.log('2. Fetch student details')
      console.log('3. Fetch case study details')
      console.log('4. Send email via Mailgun')
      console.log('5. Include "Sachverhalt ansehen" button')
    }

    // Check recent notifications for this user
    console.log('\n📊 Recent notifications for this user:')
    const { rows: recentNotifications } = await client.query(`
      SELECT id, title, message, type, created_at, read
      FROM notifications 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [user.id])
    
    recentNotifications.forEach(n => {
      console.log(`- ${n.id}: ${n.title} (${n.read ? 'Read' : 'Unread'})`)
      console.log(`  Created: ${n.created_at}`)
    })

  } catch (error) {
    console.error('❌ Error testing material notification:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the test
if (require.main === module) {
  testMaterialNotification()
    .then(() => {
      console.log('\n✅ Material notification test completed!')
      console.log('📧 Check the email inbox for charlenenowak@gmx.de')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Material notification test failed:', error.message)
      process.exit(1)
    })
}

module.exports = { testMaterialNotification }
