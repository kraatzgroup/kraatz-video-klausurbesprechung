#!/usr/bin/env node

/**
 * Fix instructor deletion constraint
 * 
 * This script updates the foreign key constraint on assigned_instructor_id
 * to allow deletion of instructors by setting assigned cases to NULL
 */

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixInstructorDeletionConstraint() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();

    console.log('\n📋 Checking current foreign key constraints...');
    const constraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'case_study_requests'
        AND kcu.column_name IN ('assigned_instructor_id', 'previous_instructor_id');
    `);

    console.log('Current constraints:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.column_name} -> ${row.foreign_table_name}(${row.foreign_column_name}) ON DELETE ${row.delete_rule}`);
    });

    // Find the constraint name for assigned_instructor_id
    const assignedConstraint = constraints.rows.find(row => row.column_name === 'assigned_instructor_id');
    const previousConstraint = constraints.rows.find(row => row.column_name === 'previous_instructor_id');

    // Drop and recreate assigned_instructor_id constraint with ON DELETE SET NULL
    if (assignedConstraint) {
      console.log(`\n🔧 Updating constraint: ${assignedConstraint.constraint_name}`);
      
      // Drop the existing constraint
      await client.query(`
        ALTER TABLE case_study_requests 
        DROP CONSTRAINT IF EXISTS ${assignedConstraint.constraint_name};
      `);
      console.log(`✅ Dropped old constraint: ${assignedConstraint.constraint_name}`);

      // Add new constraint with ON DELETE SET NULL
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD CONSTRAINT case_study_requests_assigned_instructor_id_fkey
        FOREIGN KEY (assigned_instructor_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
      `);
      console.log('✅ Added new constraint with ON DELETE SET NULL');
    } else {
      console.log('\n⚠️ No assigned_instructor_id constraint found, creating new one...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD CONSTRAINT case_study_requests_assigned_instructor_id_fkey
        FOREIGN KEY (assigned_instructor_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
      `);
      console.log('✅ Created constraint with ON DELETE SET NULL');
    }

    // Drop and recreate previous_instructor_id constraint with ON DELETE SET NULL
    if (previousConstraint) {
      console.log(`\n🔧 Updating constraint: ${previousConstraint.constraint_name}`);
      
      // Drop the existing constraint
      await client.query(`
        ALTER TABLE case_study_requests 
        DROP CONSTRAINT IF EXISTS ${previousConstraint.constraint_name};
      `);
      console.log(`✅ Dropped old constraint: ${previousConstraint.constraint_name}`);

      // Add new constraint with ON DELETE SET NULL
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD CONSTRAINT case_study_requests_previous_instructor_id_fkey
        FOREIGN KEY (previous_instructor_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
      `);
      console.log('✅ Added new constraint with ON DELETE SET NULL');
    } else if (constraints.rows.some(row => row.column_name === 'previous_instructor_id')) {
      console.log('\n⚠️ No previous_instructor_id constraint found, creating new one...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD CONSTRAINT case_study_requests_previous_instructor_id_fkey
        FOREIGN KEY (previous_instructor_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
      `);
      console.log('✅ Created constraint with ON DELETE SET NULL');
    }

    // Verify the changes
    console.log('\n📋 Verifying updated constraints...');
    const updatedConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'case_study_requests'
        AND kcu.column_name IN ('assigned_instructor_id', 'previous_instructor_id');
    `);

    console.log('Updated constraints:');
    updatedConstraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.column_name} ON DELETE ${row.delete_rule}`);
    });

    console.log('\n✅ Instructor deletion constraint fixed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Instructors can now be deleted from the admin panel');
    console.log('  - Assigned cases will automatically be set to NULL (unassigned)');
    console.log('  - Previous instructor history will be preserved until deletion');
    console.log('  - Admins can reassign unassigned cases to other instructors');

  } catch (error) {
    console.error('❌ Error fixing instructor deletion constraint:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixInstructorDeletionConstraint()
    .then(() => {
      console.log('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixInstructorDeletionConstraint };
