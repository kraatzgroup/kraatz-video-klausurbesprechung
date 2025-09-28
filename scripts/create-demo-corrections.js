#!/usr/bin/env node

/**
 * Create demo corrections for the demo user to ensure students always see corrected case studies
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

// Demo correction URLs (these should be valid URLs to demo content)
const DEMO_VIDEO_URLS = [
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo video 1
  'https://www.youtube.com/embed/oHg5SJYRHA0', // Demo video 2
  'https://www.youtube.com/embed/iik25wqIuFo', // Demo video 3
]

const DEMO_WRITTEN_CORRECTION_URL = 'https://rpgbyockvpannrupicno.supabase.co/storage/v1/object/public/case-studies/demo_written_correction.pdf'

async function createDemoCorrections() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Find demo user
    console.log('🔍 Finding demo user...')
    const { rows: demoUsers } = await client.query(`
      SELECT id, email, first_name, last_name
      FROM users 
      WHERE email = 'demo@kraatz-club.de'
      LIMIT 1
    `)
    
    if (demoUsers.length === 0) {
      throw new Error('Demo user not found!')
    }
    
    const demoUser = demoUsers[0]
    console.log(`✅ Found demo user: ${demoUser.email}`)

    // Find instructor for corrections
    console.log('🔍 Finding instructor...')
    const { rows: instructors } = await client.query(`
      SELECT id, email, first_name, last_name
      FROM users 
      WHERE role = 'instructor'
      LIMIT 1
    `)
    
    if (instructors.length === 0) {
      throw new Error('No instructor found!')
    }
    
    const instructor = instructors[0]
    console.log(`✅ Found instructor: ${instructor.email}`)

    // Find demo user's case studies without corrections
    console.log('📊 Finding case studies without corrections...')
    const { rows: casesWithoutCorrections } = await client.query(`
      SELECT id, status, legal_area, focus_area, created_at
      FROM case_study_requests 
      WHERE user_id = $1 
        AND status IN ('corrected', 'completed')
        AND (video_correction_url IS NULL OR written_correction_url IS NULL)
      ORDER BY created_at DESC
      LIMIT 5
    `, [demoUser.id])
    
    console.log(`Found ${casesWithoutCorrections.length} cases without corrections`)

    if (casesWithoutCorrections.length === 0) {
      console.log('✅ All cases already have corrections!')
      return
    }

    // Add corrections to cases
    let updatedCount = 0
    for (let i = 0; i < casesWithoutCorrections.length; i++) {
      const caseStudy = casesWithoutCorrections[i]
      const videoUrl = DEMO_VIDEO_URLS[i % DEMO_VIDEO_URLS.length]
      
      console.log(`📝 Adding corrections to case ${caseStudy.id}...`)
      
      const { error } = await client.query(`
        UPDATE case_study_requests 
        SET 
          video_correction_url = $1,
          written_correction_url = $2,
          assigned_instructor_id = $3,
          status = 'corrected',
          updated_at = NOW()
        WHERE id = $4
      `, [
        videoUrl,
        DEMO_WRITTEN_CORRECTION_URL,
        instructor.id,
        caseStudy.id
      ])
      
      if (error) {
        console.error(`❌ Error updating case ${caseStudy.id}:`, error)
      } else {
        console.log(`✅ Updated case ${caseStudy.id} with corrections`)
        updatedCount++
      }
    }

    console.log(`\n🎯 Demo corrections created successfully!`)
    console.log(`- Updated ${updatedCount} case studies`)
    console.log(`- Demo user: ${demoUser.email}`)
    console.log(`- Instructor: ${instructor.email}`)
    console.log(`- Video corrections: ${updatedCount}`)
    console.log(`- Written corrections: ${updatedCount}`)

    // Verify the updates
    console.log('\n📊 Verifying updates...')
    const { rows: updatedCases } = await client.query(`
      SELECT 
        id, status, 
        video_correction_url, written_correction_url,
        correction_viewed_at
      FROM case_study_requests 
      WHERE user_id = $1 
        AND status IN ('corrected', 'completed')
        AND (video_correction_url IS NOT NULL OR written_correction_url IS NOT NULL)
      ORDER BY created_at DESC
    `, [demoUser.id])
    
    console.log(`✅ Demo user now has ${updatedCases.length} cases with corrections`)
    console.log('Cases with corrections:')
    updatedCases.forEach(c => {
      console.log(`- ${c.id}: video=${!!c.video_correction_url}, written=${!!c.written_correction_url}, viewed=${!!c.correction_viewed_at}`)
    })

  } catch (error) {
    console.error('❌ Error creating demo corrections:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  createDemoCorrections()
    .then(() => {
      console.log('\n✅ Demo corrections creation completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Demo corrections creation failed:', error.message)
      process.exit(1)
    })
}

module.exports = { createDemoCorrections }
