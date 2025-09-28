#!/usr/bin/env node

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function checkUserRole() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Find user by email
    const { rows: users } = await client.query(`
      SELECT id, email, first_name, last_name, role, instructor_legal_area
      FROM users 
      WHERE email = 'charlenenowak@gmx.de'
    `)
    
    if (users.length === 0) {
      console.log('❌ User not found')
      return
    }

    const user = users[0]
    console.log('👤 User found:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.first_name} ${user.last_name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Legal Area: ${user.instructor_legal_area || 'N/A'}`)
    console.log(`   ID: ${user.id}`)

    if (user.role === 'student') {
      console.log('\n📝 Sie sind als Student angemeldet.')
      console.log('💡 Toast-Notifications sind im Dozenten-Dashboard implementiert.')
      console.log('🎯 Um die Toast-Notifications zu testen:')
      console.log('   1. Navigieren Sie zu /instructor-dashboard')
      console.log('   2. Oder melden Sie sich als Dozent an')
    } else if (user.role === 'instructor' || user.role === 'springer') {
      console.log('\n✅ Sie haben Dozenten-Rechte!')
      console.log('🎯 Navigieren Sie zu /instructor-dashboard um Toast-Notifications zu testen')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

checkUserRole()
