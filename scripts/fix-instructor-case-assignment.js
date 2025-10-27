#!/usr/bin/env node

/**
 * Fix instructor case assignment system
 * 
 * This script:
 * 1. Adds missing columns for proper case assignment tracking
 * 2. Migrates existing data from instructor_id to assigned_instructor_id
 * 3. Ensures instructors always see their cases, even during vacation mode
 */

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixInstructorCaseAssignment() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();

    console.log('📋 Checking current case_study_requests table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:', tableInfo.rows.map(r => `${r.column_name} (${r.data_type})`));

    // Check if assigned_instructor_id exists
    const hasAssignedInstructorId = tableInfo.rows.some(row => row.column_name === 'assigned_instructor_id');
    const hasPreviousInstructorId = tableInfo.rows.some(row => row.column_name === 'previous_instructor_id');
    const hasAssignmentDate = tableInfo.rows.some(row => row.column_name === 'assignment_date');
    const hasAssignmentReason = tableInfo.rows.some(row => row.column_name === 'assignment_reason');

    console.log('\n🔍 Column check:');
    console.log(`  - assigned_instructor_id: ${hasAssignedInstructorId ? '✅ exists' : '❌ missing'}`);
    console.log(`  - previous_instructor_id: ${hasPreviousInstructorId ? '✅ exists' : '❌ missing'}`);
    console.log(`  - assignment_date: ${hasAssignmentDate ? '✅ exists' : '❌ missing'}`);
    console.log(`  - assignment_reason: ${hasAssignmentReason ? '✅ exists' : '❌ missing'}`);

    // Add missing columns
    if (!hasAssignedInstructorId) {
      console.log('\n➕ Adding assigned_instructor_id column...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD COLUMN assigned_instructor_id UUID REFERENCES users(id);
      `);
      
      // Create index for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_case_study_requests_assigned_instructor_id 
        ON case_study_requests(assigned_instructor_id);
      `);
      
      console.log('✅ assigned_instructor_id column added');
    }

    if (!hasPreviousInstructorId) {
      console.log('\n➕ Adding previous_instructor_id column...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD COLUMN previous_instructor_id UUID REFERENCES users(id);
      `);
      
      // Create index for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_case_study_requests_previous_instructor_id 
        ON case_study_requests(previous_instructor_id);
      `);
      
      console.log('✅ previous_instructor_id column added');
    }

    if (!hasAssignmentDate) {
      console.log('\n➕ Adding assignment_date column...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD COLUMN assignment_date TIMESTAMPTZ;
      `);
      console.log('✅ assignment_date column added');
    }

    if (!hasAssignmentReason) {
      console.log('\n➕ Adding assignment_reason column...');
      await client.query(`
        ALTER TABLE case_study_requests 
        ADD COLUMN assignment_reason TEXT;
      `);
      console.log('✅ assignment_reason column added');
    }

    // Migrate data from instructor_id to assigned_instructor_id if needed
    const hasInstructorId = tableInfo.rows.some(row => row.column_name === 'instructor_id');
    if (hasInstructorId && !hasAssignedInstructorId) {
      console.log('\n🔄 Migrating data from instructor_id to assigned_instructor_id...');
      
      const migrationResult = await client.query(`
        UPDATE case_study_requests 
        SET assigned_instructor_id = instructor_id,
            assignment_date = updated_at,
            assignment_reason = 'Migrated from instructor_id column'
        WHERE instructor_id IS NOT NULL 
        AND assigned_instructor_id IS NULL;
      `);
      
      console.log(`✅ Migrated ${migrationResult.rowCount} records`);
    }

    // Auto-assign cases based on legal area for cases without assigned instructor
    console.log('\n🎯 Auto-assigning unassigned cases based on legal area...');
    
    // Get all legal areas with unassigned cases
    const unassignedCases = await client.query(`
      SELECT legal_area, COUNT(*) as count
      FROM case_study_requests 
      WHERE assigned_instructor_id IS NULL 
      AND status NOT IN ('completed', 'corrected')
      GROUP BY legal_area;
    `);

    console.log(`Found unassigned cases:`, unassignedCases.rows);

    for (const caseGroup of unassignedCases.rows) {
      const legalArea = caseGroup.legal_area;
      const count = caseGroup.count;
      
      console.log(`\n🔍 Processing ${count} unassigned ${legalArea} cases...`);
      
      // Find active instructors for this legal area
      const instructors = await client.query(`
        SELECT id, first_name, last_name, email_notifications_enabled
        FROM users 
        WHERE role = 'instructor' 
        AND instructor_legal_area = $1
        AND email_notifications_enabled = true
        ORDER BY created_at ASC;
      `, [legalArea]);

      if (instructors.rows.length === 0) {
        console.log(`⚠️ No active instructors found for ${legalArea}`);
        continue;
      }

      // Use the first active instructor
      const instructor = instructors.rows[0];
      console.log(`👨‍🏫 Assigning to: ${instructor.first_name} ${instructor.last_name}`);

      const assignResult = await client.query(`
        UPDATE case_study_requests 
        SET assigned_instructor_id = $1,
            assignment_date = NOW(),
            assignment_reason = 'Auto-assigned based on legal area specialization'
        WHERE legal_area = $2 
        AND assigned_instructor_id IS NULL 
        AND status NOT IN ('completed', 'corrected');
      `, [instructor.id, legalArea]);

      console.log(`✅ Assigned ${assignResult.rowCount} cases to ${instructor.first_name} ${instructor.last_name}`);
    }

    // Update database types documentation
    console.log('\n📝 Database schema updated successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Update src/types/database.ts to include new columns');
    console.log('2. Update CaseStudyRequest interface in components');
    console.log('3. Test instructor dashboard filtering');
    console.log('4. Test vacation mode case transfers');

    console.log('\n📊 Final verification...');
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_cases,
        COUNT(assigned_instructor_id) as assigned_cases,
        COUNT(previous_instructor_id) as cases_with_history
      FROM case_study_requests;
    `);

    console.log('Final statistics:', finalStats.rows[0]);

  } catch (error) {
    console.error('❌ Error fixing instructor case assignment:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixInstructorCaseAssignment()
    .then(() => {
      console.log('✅ Instructor case assignment system fixed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixInstructorCaseAssignment };
