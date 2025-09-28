#!/usr/bin/env node

/**
 * Check demo user's case studies to ensure they have corrected cases to view
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function checkDemoUserCases() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    console.log('🔍 Finding demo user...')
    const { rows: demoUsers } = await client.query(`
      SELECT id, email, first_name, last_name, role
      FROM users 
      WHERE email LIKE '%demo%' OR email LIKE '%test%'
      ORDER BY created_at
    `)
    
    console.log('Demo users found:')
    demoUsers.forEach(u => {
      console.log(`- ${u.id}: ${u.email} (${u.first_name} ${u.last_name}) - ${u.role}`)
    })
    
    if (demoUsers.length > 0) {
      const demoUser = demoUsers[0]
      console.log(`\n📊 Checking case studies for demo user: ${demoUser.email}`)
      
      const { rows: demoCases } = await client.query(`
        SELECT 
          id, status, 
          video_correction_url, written_correction_url,
          correction_viewed_at, 
          created_at
        FROM case_study_requests 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [demoUser.id])
      
      console.log(`Found ${demoCases.length} cases for demo user:`)
      demoCases.forEach(c => {
        console.log(`- ${c.id}: ${c.status}`)
        console.log(`  Video: ${!!c.video_correction_url}, Written: ${!!c.written_correction_url}`)
        console.log(`  Viewed: correction=${!!c.correction_viewed_at}`)
        console.log(`  Created: ${c.created_at}`)
        console.log('')
      })
      
      // Count corrected cases
      const correctedCases = demoCases.filter(c => 
        c.status === 'corrected' || c.status === 'completed'
      )
      console.log(`📈 Summary for ${demoUser.email}:`)
      console.log(`- Total cases: ${demoCases.length}`)
      console.log(`- Corrected cases: ${correctedCases.length}`)
      console.log(`- Cases with video: ${demoCases.filter(c => c.video_correction_url).length}`)
      console.log(`- Cases with written: ${demoCases.filter(c => c.written_correction_url).length}`)
      
      return { demoUser, demoCases, correctedCases }
    } else {
      console.log('❌ No demo user found!')
      return null
    }

  } catch (error) {
    console.error('❌ Error checking demo user cases:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the check
if (require.main === module) {
  checkDemoUserCases()
    .then((result) => {
      if (result && result.correctedCases.length === 0) {
        console.log('\n⚠️  Demo user has no corrected cases! Creating demo data...')
        // We'll create demo data in the next step
      } else {
        console.log('\n✅ Demo user case check completed!')
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Demo user case check failed:', error.message)
      process.exit(1)
    })
}

module.exports = { checkDemoUserCases }
