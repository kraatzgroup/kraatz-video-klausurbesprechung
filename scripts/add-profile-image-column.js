#!/usr/bin/env node

/**
 * Add profile_image_url column to users table for profile pictures
 * This enables instructors, springer, and admins to upload profile pictures
 */

const { Client } = require('pg')

// Database connection using user's preferred direct PostgreSQL approach
const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function addProfileImageColumn() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    // Add profile_image_url column to users table
    const alterTableQuery = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
    `

    console.log('🔄 Adding profile_image_url column to users table...')
    await client.query(alterTableQuery)
    console.log('✅ Successfully added profile_image_url column')

    // Add comment for documentation
    const commentQuery = `
      COMMENT ON COLUMN users.profile_image_url IS 
      'URL to user profile image stored in Supabase storage. Used for instructors, springer, and admins to personalize student experience.';
    `

    await client.query(commentQuery)
    console.log('✅ Added column documentation')

    console.log('\n🎯 Profile image system ready!')
    console.log('   - Instructors can upload profile pictures')
    console.log('   - Springer can upload profile pictures')
    console.log('   - Admins can upload profile pictures')
    console.log('   - Students will see personalized instructor profiles')

  } catch (error) {
    console.error('❌ Error adding profile_image_url column:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
if (require.main === module) {
  addProfileImageColumn()
    .then(() => {
      console.log('\n✅ Profile image column migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message)
      process.exit(1)
    })
}

module.exports = { addProfileImageColumn }
