#!/usr/bin/env node

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function makeUserInstructor() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Update user role to instructor
    const { rows } = await client.query(`
      UPDATE users 
      SET role = 'instructor', instructor_legal_area = 'Zivilrecht'
      WHERE email = 'charlenenowak@gmx.de'
      RETURNING id, email, role, instructor_legal_area
    `)
    
    if (rows.length === 0) {
      console.log('❌ User not found')
      return
    }

    const user = rows[0]
    console.log('✅ User updated successfully:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Legal Area: ${user.instructor_legal_area}`)
    console.log(`   ID: ${user.id}`)

    console.log('\n🎯 Jetzt können Sie:')
    console.log('   1. Die Seite neu laden (F5)')
    console.log('   2. Zum Dozenten-Dashboard navigieren (/instructor-dashboard)')
    console.log('   3. Toast-Notifications bei Noteneingabe testen')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

makeUserInstructor()
