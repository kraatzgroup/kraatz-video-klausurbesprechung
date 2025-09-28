#!/usr/bin/env node

/**
 * Ensure demo user always has corrected case studies available
 * This script can be run regularly to maintain demo data
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function ensureDemoCorrections() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Check demo user's corrected cases
    console.log('📊 Checking demo user corrections...')
    const { rows: demoCorrections } = await client.query(`
      SELECT COUNT(*) as count
      FROM case_study_requests csr
      JOIN users u ON u.id = csr.user_id
      WHERE u.email = 'demo@kraatz-club.de'
        AND csr.status IN ('corrected', 'completed')
        AND (csr.video_correction_url IS NOT NULL OR csr.written_correction_url IS NOT NULL)
    `)
    
    const correctionCount = parseInt(demoCorrections[0].count)
    console.log(`Demo user has ${correctionCount} corrected cases with actual corrections`)

    if (correctionCount < 3) {
      console.log('⚠️  Demo user has insufficient corrections, creating more...')
      
      // Import and run the create demo corrections function
      const { createDemoCorrections } = require('./create-demo-corrections.js')
      await createDemoCorrections()
      
      console.log('✅ Demo corrections ensured!')
    } else {
      console.log('✅ Demo user has sufficient corrections')
    }

    // Also ensure some corrections are marked as "new" (not viewed)
    console.log('📊 Checking for new corrections...')
    const { rows: newCorrections } = await client.query(`
      SELECT COUNT(*) as count
      FROM case_study_requests csr
      JOIN users u ON u.id = csr.user_id
      WHERE u.email = 'demo@kraatz-club.de'
        AND csr.status IN ('corrected', 'completed')
        AND (csr.video_correction_url IS NOT NULL OR csr.written_correction_url IS NOT NULL)
        AND csr.correction_viewed_at IS NULL
    `)
    
    const newCount = parseInt(newCorrections[0].count)
    console.log(`Demo user has ${newCount} new (unviewed) corrections`)

    if (newCount === 0) {
      console.log('⚠️  No new corrections, marking some as unviewed...')
      
      // Mark some corrections as unviewed to show the "new corrections" banner
      await client.query(`
        UPDATE case_study_requests 
        SET correction_viewed_at = NULL
        WHERE user_id = (SELECT id FROM users WHERE email = 'demo@kraatz-club.de')
          AND status IN ('corrected', 'completed')
          AND (video_correction_url IS NOT NULL OR written_correction_url IS NOT NULL)
          AND id IN (
            SELECT id FROM case_study_requests 
            WHERE user_id = (SELECT id FROM users WHERE email = 'demo@kraatz-club.de')
              AND status IN ('corrected', 'completed')
              AND (video_correction_url IS NOT NULL OR written_correction_url IS NOT NULL)
            ORDER BY created_at DESC 
            LIMIT 2
          )
      `)
      
      console.log('✅ Marked 2 corrections as new (unviewed)')
    }

    console.log('\n🎯 Demo corrections status ensured!')
    console.log('- Students will always see corrected case studies')
    console.log('- New correction notifications will appear')
    console.log('- Demo experience is consistent')

  } catch (error) {
    console.error('❌ Error ensuring demo corrections:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  ensureDemoCorrections()
    .then(() => {
      console.log('\n✅ Demo corrections ensured successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Failed to ensure demo corrections:', error.message)
      process.exit(1)
    })
}

module.exports = { ensureDemoCorrections }
