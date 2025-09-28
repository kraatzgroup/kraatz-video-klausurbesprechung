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

    // Update user role to instructor with Öffentliches Recht
    const { rows } = await client.query(`
      UPDATE users 
      SET role = 'instructor', instructor_legal_area = 'Öffentliches Recht'
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

    console.log('\n🎯 Jetzt können Sie die Toast-Notifications testen:')
    console.log('   1. Laden Sie die Seite neu (F5 oder Cmd+R)')
    console.log('   2. Navigieren Sie zu: /instructor-dashboard')
    console.log('   3. Sie sollten einen Test-Toast sehen: "System bereit"')
    console.log('   4. Geben Sie eine Note ein und verlassen Sie das Feld')
    console.log('   5. Sie sollten einen Success-Toast sehen: "Note gespeichert"')

    console.log('\n📝 Erwartete Toast-Nachrichten:')
    console.log('   ✅ "System bereit: Dozenten-Dashboard geladen - Toast-System funktioniert!"')
    console.log('   ✅ "Note gespeichert: Note X Punkte (Beschreibung) wurde erfolgreich gespeichert."')
    console.log('   ❌ "Fehler beim Speichern: Die Note konnte nicht gespeichert werden..."')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

makeUserInstructor()
