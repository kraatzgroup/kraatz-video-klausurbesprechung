#!/usr/bin/env node

/**
 * Check for database triggers that might interfere with case assignments
 */

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseTriggers() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();

    console.log('🔍 Checking for triggers on users table...');
    const userTriggers = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'users'
      AND event_object_schema = 'public';
    `);

    console.log(`Found ${userTriggers.rows.length} triggers on users table:`);
    userTriggers.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      console.log(`    Action: ${trigger.action_statement}`);
    });

    console.log('\n🔍 Checking for triggers on case_study_requests table...');
    const caseTriggers = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'case_study_requests'
      AND event_object_schema = 'public';
    `);

    console.log(`Found ${caseTriggers.rows.length} triggers on case_study_requests table:`);
    caseTriggers.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      console.log(`    Action: ${trigger.action_statement}`);
    });

    console.log('\n🔍 Checking RLS policies on case_study_requests table...');
    const rlsPolicies = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'case_study_requests';
    `);

    console.log(`Found ${rlsPolicies.rows.length} RLS policies on case_study_requests table:`);
    rlsPolicies.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
      console.log(`    Roles: ${policy.roles}`);
      console.log(`    Condition: ${policy.qual}`);
      if (policy.with_check) {
        console.log(`    With Check: ${policy.with_check}`);
      }
    });

    console.log('\n📊 Current case assignment status...');
    const assignmentStats = await client.query(`
      SELECT 
        legal_area,
        COUNT(*) as total_cases,
        COUNT(assigned_instructor_id) as assigned_cases,
        COUNT(CASE WHEN assigned_instructor_id IS NULL THEN 1 END) as unassigned_cases
      FROM case_study_requests 
      GROUP BY legal_area
      ORDER BY legal_area;
    `);

    console.log('Assignment statistics by legal area:');
    assignmentStats.rows.forEach(stat => {
      console.log(`  - ${stat.legal_area}: ${stat.assigned_cases}/${stat.total_cases} assigned (${stat.unassigned_cases} unassigned)`);
    });

  } catch (error) {
    console.error('❌ Error checking database triggers:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkDatabaseTriggers()
    .then(() => {
      console.log('✅ Database trigger check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseTriggers };
