#!/usr/bin/env node

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function checkLegalAreas() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Check existing instructors and their legal areas
    const { rows: instructors } = await client.query(`
      SELECT email, role, instructor_legal_area
      FROM users 
      WHERE role IN ('instructor', 'springer')
      ORDER BY instructor_legal_area
    `)
    
    console.log('📋 Existing instructors and their legal areas:')
    instructors.forEach(i => {
      console.log(`   ${i.email}: ${i.instructor_legal_area} (${i.role})`)
    })

    // Try to get constraint info
    console.log('\n🔍 Checking constraint...')
    const { rows: constraints } = await client.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conname = 'users_legal_areas_check'
    `)
    
    if (constraints.length > 0) {
      console.log('📝 Constraint definition:')
      console.log(`   ${constraints[0].consrc}`)
    }

    // Update user with correct legal area
    console.log('\n🔧 Updating user with correct legal area...')
    const { rows } = await client.query(`
      UPDATE users 
      SET role = 'instructor', instructor_legal_area = 'Strafrecht'
      WHERE email = 'charlenenowak@gmx.de'
      RETURNING id, email, role, instructor_legal_area
    `)
    
    if (rows.length > 0) {
      const user = rows[0]
      console.log('✅ User updated successfully:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Legal Area: ${user.instructor_legal_area}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkLegalAreas()
