#!/usr/bin/env node

/**
 * Create a comprehensive admin delete function for case studies
 * This ensures all related data is properly removed from the database
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

async function createAdminDeleteFunction() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('🔗 Connected to PostgreSQL database')

    console.log('🔧 Creating admin_delete_case_study function...')
    
    // Create a comprehensive delete function
    await client.query(`
      CREATE OR REPLACE FUNCTION admin_delete_case_study(case_id UUID)
      RETURNS JSON AS $$
      DECLARE
        result JSON;
        deleted_submissions INTEGER := 0;
        deleted_ratings INTEGER := 0;
        deleted_notifications INTEGER := 0;
        case_exists BOOLEAN := FALSE;
      BEGIN
        -- Check if case exists
        SELECT EXISTS(SELECT 1 FROM case_study_requests WHERE id = case_id) INTO case_exists;
        
        IF NOT case_exists THEN
          RETURN json_build_object(
            'success', false,
            'error', 'Case study not found'
          );
        END IF;
        
        -- Delete related submissions
        DELETE FROM submissions WHERE case_study_request_id = case_id;
        GET DIAGNOSTICS deleted_submissions = ROW_COUNT;
        
        -- Delete related ratings (using correct column name)
        DELETE FROM case_study_ratings WHERE case_study_id = case_id;
        GET DIAGNOSTICS deleted_ratings = ROW_COUNT;
        
        -- Delete related notifications
        DELETE FROM notifications WHERE related_case_study_id = case_id;
        GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
        
        -- Delete the main case study request
        DELETE FROM case_study_requests WHERE id = case_id;
        
        -- Return success with details
        RETURN json_build_object(
          'success', true,
          'deleted_submissions', deleted_submissions,
          'deleted_ratings', deleted_ratings,
          'deleted_notifications', deleted_notifications,
          'message', 'Case study and all related data deleted successfully'
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- Return error details
        RETURN json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE
        );
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('✅ Admin delete function created successfully!')

    // Test the function
    console.log('\n🧪 Testing function with a non-existent case...')
    const { rows: testResult } = await client.query(`
      SELECT admin_delete_case_study('00000000-0000-0000-0000-000000000000'::UUID) as result
    `)
    
    console.log('Test result:', testResult[0].result)

    console.log('\n🎯 Admin delete function is ready!')
    console.log('Usage: SELECT admin_delete_case_study(case_id::UUID)')
    console.log('Features:')
    console.log('- Deletes submissions')
    console.log('- Deletes ratings') 
    console.log('- Deletes notifications')
    console.log('- Deletes main case study')
    console.log('- Returns detailed results')
    console.log('- Handles errors gracefully')

  } catch (error) {
    console.error('❌ Error creating admin delete function:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  createAdminDeleteFunction()
    .then(() => {
      console.log('\n✅ Admin delete function creation completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Admin delete function creation failed:', error.message)
      process.exit(1)
    })
}

module.exports = { createAdminDeleteFunction }
