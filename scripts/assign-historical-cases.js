const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function assignHistoricalCases() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('📋 Assigning Historical Cases to Instructors');
    console.log('=' .repeat(50));

    // 1. Get all instructors with their legal areas
    console.log('\n1. 👨‍🏫 Fetching instructors...');
    const { rows: instructors } = await client.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        instructor_legal_area,
        legal_areas
      FROM users 
      WHERE role IN ('instructor', 'springer')
      ORDER BY role, first_name;
    `);

    console.log(`   Found ${instructors.length} instructors/springer:`);
    instructors.forEach(instructor => {
      const areas = instructor.legal_areas || 
        (instructor.instructor_legal_area ? [instructor.instructor_legal_area] : []);
      console.log(`   - ${instructor.first_name} ${instructor.last_name}: ${areas.join(', ')}`);
    });

    // 2. Get unassigned cases
    console.log('\n2. 📋 Finding unassigned cases...');
    const { rows: unassignedCases } = await client.query(`
      SELECT 
        id,
        user_id,
        legal_area,
        sub_area,
        status,
        created_at,
        updated_at
      FROM case_study_requests 
      WHERE assigned_instructor_id IS NULL
      ORDER BY legal_area, created_at;
    `);

    console.log(`   Found ${unassignedCases.length} unassigned cases`);

    // 3. Auto-assign cases based on legal area
    let assignedCount = 0;
    const assignments = [];

    for (const case_ of unassignedCases) {
      console.log(`\n   📋 Processing case ${case_.id} (${case_.legal_area} - ${case_.sub_area})`);
      
      // Find instructors for this legal area
      const eligibleInstructors = instructors.filter(instructor => {
        const areas = instructor.legal_areas || 
          (instructor.instructor_legal_area ? [instructor.instructor_legal_area] : []);
        return areas.includes(case_.legal_area);
      });

      if (eligibleInstructors.length > 0) {
        // Prefer instructors over springer, then use first available
        const instructor = eligibleInstructors.find(i => i.role !== 'springer') || eligibleInstructors[0];
        
        console.log(`      → Assigning to: ${instructor.first_name} ${instructor.last_name}`);
        
        // Update the case
        try {
          await client.query(`
            UPDATE case_study_requests 
            SET 
              assigned_instructor_id = $1,
              assignment_date = $2,
              assignment_reason = $3
            WHERE id = $4
          `, [
            instructor.id,
            new Date().toISOString(),
            'Historical assignment based on legal area',
            case_.id
          ]);

          assignedCount++;
          assignments.push({
            case_id: case_.id,
            legal_area: case_.legal_area,
            sub_area: case_.sub_area,
            instructor: `${instructor.first_name} ${instructor.last_name}`,
            status: case_.status
          });
          console.log(`      ✅ Successfully assigned`);
        } catch (error) {
          console.error(`      ❌ Error assigning case: ${error.message}`);
        }
      } else {
        console.log(`      ⚠️ No instructor found for ${case_.legal_area}`);
      }
    }

    // 4. Summary
    console.log('\n4. 📊 Assignment Summary');
    console.log('   ═══════════════════════');
    console.log(`   Total cases processed: ${unassignedCases.length}`);
    console.log(`   Successfully assigned: ${assignedCount}`);
    console.log(`   Unassigned remaining: ${unassignedCases.length - assignedCount}`);

    if (assignments.length > 0) {
      console.log('\n   📋 Assignments made:');
      const groupedByInstructor = {};
      assignments.forEach(assignment => {
        if (!groupedByInstructor[assignment.instructor]) {
          groupedByInstructor[assignment.instructor] = [];
        }
        groupedByInstructor[assignment.instructor].push(assignment);
      });

      Object.entries(groupedByInstructor).forEach(([instructor, cases]) => {
        console.log(`\n   👨‍🏫 ${instructor}: ${cases.length} cases`);
        cases.forEach(case_ => {
          console.log(`      - ${case_.legal_area}/${case_.sub_area} (${case_.status})`);
        });
      });
    }

    // 5. Check current assignment status
    console.log('\n5. 📈 Current Assignment Status');
    const { rows: assignmentStats } = await client.query(`
      SELECT 
        legal_area,
        status,
        COUNT(*) as total_cases,
        COUNT(assigned_instructor_id) as assigned_cases,
        COUNT(*) - COUNT(assigned_instructor_id) as unassigned_cases
      FROM case_study_requests 
      GROUP BY legal_area, status
      ORDER BY legal_area, status;
    `);

    console.log('\n   Assignment statistics by legal area and status:');
    assignmentStats.forEach(stat => {
      const percentage = ((stat.assigned_cases / stat.total_cases) * 100).toFixed(1);
      console.log(`   ${stat.legal_area} - ${stat.status}:`);
      console.log(`      Total: ${stat.total_cases}, Assigned: ${stat.assigned_cases} (${percentage}%), Unassigned: ${stat.unassigned_cases}`);
    });

    console.log('\n✅ Historical case assignment completed!');

  } catch (error) {
    console.error('❌ Error assigning historical cases:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the assignment
assignHistoricalCases()
  .then(() => {
    console.log('🎉 Historical assignment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Assignment failed:', error);
    process.exit(1);
  });
