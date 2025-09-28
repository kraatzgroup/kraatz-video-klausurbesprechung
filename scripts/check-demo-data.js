#!/usr/bin/env node

/**
 * Check demo data and ensure students have corrected case studies to view
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function checkDemoData() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    console.log('📊 Checking case study requests with corrections...')
    const { rows: correctedCases } = await client.query(`
      SELECT 
        id, user_id, status, 
        video_correction_url, written_correction_url,
        created_at, updated_at
      FROM case_study_requests 
      WHERE status IN ('corrected', 'completed')
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log(`Found ${correctedCases.length} corrected cases:`)
    correctedCases.forEach(c => {
      console.log(`- ${c.id}: ${c.status}, video: ${!!c.video_correction_url}, written: ${!!c.written_correction_url}`)
    })

    console.log('\n📊 Checking all case study requests by status...')
    const { rows: allCases } = await client.query(`
      SELECT status, COUNT(*) as count
      FROM case_study_requests 
      GROUP BY status
      ORDER BY count DESC
    `)
    
    console.log('All cases by status:')
    allCases.forEach(c => {
      console.log(`- ${c.status}: ${c.count}`)
    })

    console.log('\n📊 Checking users...')
    const { rows: users } = await client.query(`
      SELECT id, email, role, first_name, last_name
      FROM users 
      WHERE role = 'student'
      LIMIT 5
    `)
    
    console.log('Student users:')
    users.forEach(u => {
      console.log(`- ${u.email} (${u.first_name} ${u.last_name})`)
    })

  } catch (error) {
    console.error('❌ Error checking demo data:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the check
if (require.main === module) {
  checkDemoData()
    .then(() => {
      console.log('\n✅ Demo data check completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Demo data check failed:', error.message)
      process.exit(1)
    })
}

module.exports = { checkDemoData }
