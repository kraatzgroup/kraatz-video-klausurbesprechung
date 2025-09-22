require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function addCaseAssignmentFields() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('📋 Adding Case Assignment Fields');
    console.log('=' .repeat(50));

    // 1. Add assigned_instructor_id to case_study_requests
    console.log('\n1. 👨‍🏫 Adding assigned_instructor_id to case_study_requests...');
    await client.query(`
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS assigned_instructor_id UUID REFERENCES users(id);
    `);
    console.log('   ✅ assigned_instructor_id column added');

    // 2. Add assignment_date
    console.log('\n2. 📅 Adding assignment_date...');
    await client.query(`
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    `);
    console.log('   ✅ assignment_date column added');

    // 3. Add assignment_reason
    console.log('\n3. 📝 Adding assignment_reason...');
    await client.query(`
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS assignment_reason TEXT DEFAULT NULL;
    `);
    console.log('   ✅ assignment_reason column added');

    // 4. Add previous_instructor_id for tracking transfers
    console.log('\n4. 🔄 Adding previous_instructor_id...');
    await client.query(`
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS previous_instructor_id UUID REFERENCES users(id);
    `);
    console.log('   ✅ previous_instructor_id column added');

    // 5. Create index for efficient assignment queries
    console.log('\n5. 🔍 Creating assignment indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_case_assignments 
      ON case_study_requests (assigned_instructor_id, status) 
      WHERE assigned_instructor_id IS NOT NULL;
    `);
    console.log('   ✅ Assignment index created');

    // 6. Create index for legal area and status queries
    console.log('\n6. 🔍 Creating legal area status index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_case_legal_area_status 
      ON case_study_requests (legal_area, status);
    `);
    console.log('   ✅ Legal area status index created');

    // 7. Show current schema
    console.log('\n7. 📋 Current case_study_requests schema (assignment fields):');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND (column_name LIKE '%assign%' OR column_name LIKE '%instructor%')
      ORDER BY ordinal_position;
    `);

    if (columns.length > 0) {
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'NULL'})`);
      });
    } else {
      console.log('   No assignment columns found');
    }

    // 8. Check current case statuses
    console.log('\n8. 📊 Current case status distribution:');
    const { rows: statusStats } = await client.query(`
      SELECT 
        status,
        legal_area,
        COUNT(*) as count
      FROM case_study_requests 
      GROUP BY status, legal_area
      ORDER BY legal_area, status;
    `);

    statusStats.forEach(stat => {
      console.log(`   ${stat.legal_area} - ${stat.status}: ${stat.count} cases`);
    });

    console.log('\n✅ Case assignment fields added successfully!');
    console.log('📋 Summary:');
    console.log('   - assigned_instructor_id: UUID (tracks current responsible instructor)');
    console.log('   - assignment_date: TIMESTAMP (when assignment was made)');
    console.log('   - assignment_reason: TEXT (reason for assignment/transfer)');
    console.log('   - previous_instructor_id: UUID (tracks transfers for vacation)');
    console.log('   - Indexes created for efficient queries');

  } catch (error) {
    console.error('❌ Error adding case assignment fields:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
addCaseAssignmentFields()
  .then(() => {
    console.log('🎉 Case assignment fields migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
