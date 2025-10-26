// Assign existing case studies to appropriate instructors based on legal area
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function assignExistingCasesToInstructors() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔍 Analyzing existing case studies and instructors...');

    // Get all instructors with their legal areas
    const instructorsQuery = `
      SELECT id, email, first_name, last_name, instructor_legal_area
      FROM users 
      WHERE role = 'instructor' 
        AND instructor_legal_area IS NOT NULL
      ORDER BY instructor_legal_area, email;
    `;
    
    const instructorsResult = await client.query(instructorsQuery);
    
    if (instructorsResult.rows.length === 0) {
      console.log('❌ No instructors found with legal areas assigned');
      return;
    }

    console.log('👨‍🏫 Available Instructors:');
    instructorsResult.rows.forEach(instructor => {
      console.log(`  - ${instructor.first_name} ${instructor.last_name} (${instructor.email}) - ${instructor.instructor_legal_area}`);
    });
    console.log('');

    // Get all unassigned case studies
    const unassignedCasesQuery = `
      SELECT 
        csr.id,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area,
        csr.status,
        csr.created_at,
        u.email as student_email,
        u.first_name as student_first_name,
        u.last_name as student_last_name
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      WHERE csr.assigned_instructor_id IS NULL
      ORDER BY csr.legal_area, csr.created_at;
    `;
    
    const unassignedResult = await client.query(unassignedCasesQuery);
    
    console.log(`📋 Found ${unassignedResult.rows.length} unassigned case studies`);
    console.log('');

    if (unassignedResult.rows.length === 0) {
      console.log('✅ All case studies are already assigned');
      return;
    }

    // Group instructors by legal area for easy lookup
    const instructorsByLegalArea = {};
    instructorsResult.rows.forEach(instructor => {
      if (!instructorsByLegalArea[instructor.instructor_legal_area]) {
        instructorsByLegalArea[instructor.instructor_legal_area] = [];
      }
      instructorsByLegalArea[instructor.instructor_legal_area].push(instructor);
    });

    console.log('🎯 Starting assignment process...');
    console.log('');

    let assignedCount = 0;
    let unassignableCount = 0;

    // Assign each case study to an appropriate instructor
    for (const caseStudy of unassignedResult.rows) {
      const availableInstructors = instructorsByLegalArea[caseStudy.legal_area];
      
      if (!availableInstructors || availableInstructors.length === 0) {
        console.log(`⚠️  No instructor available for ${caseStudy.legal_area} - Case ID: ${caseStudy.id}`);
        unassignableCount++;
        continue;
      }

      // For now, assign to the first available instructor
      // In the future, you could implement load balancing here
      const assignedInstructor = availableInstructors[0];

      console.log(`👨‍🏫 Assigning Case ID ${caseStudy.id} (${caseStudy.legal_area} - ${caseStudy.sub_area})`);
      console.log(`   Student: ${caseStudy.student_first_name} ${caseStudy.student_last_name} (${caseStudy.student_email})`);
      console.log(`   Instructor: ${assignedInstructor.first_name} ${assignedInstructor.last_name} (${assignedInstructor.email})`);

      // Update the case study with assigned instructor
      const updateQuery = `
        UPDATE case_study_requests 
        SET 
          assigned_instructor_id = $1,
          updated_at = NOW()
        WHERE id = $2;
      `;
      
      const updateResult = await client.query(updateQuery, [assignedInstructor.id, caseStudy.id]);
      
      if (updateResult.rowCount === 1) {
        console.log('   ✅ Successfully assigned');
        assignedCount++;
      } else {
        console.log('   ❌ Assignment failed');
      }
      console.log('');
    }

    console.log('📊 Assignment Summary:');
    console.log(`  ✅ Successfully assigned: ${assignedCount} case studies`);
    console.log(`  ⚠️  Could not assign: ${unassignableCount} case studies`);
    console.log(`  📋 Total processed: ${unassignedResult.rows.length} case studies`);
    console.log('');

    if (unassignableCount > 0) {
      console.log('💡 To fix unassignable cases:');
      console.log('   1. Create instructors for missing legal areas');
      console.log('   2. Assign instructor_legal_area to existing instructors');
      console.log('   3. Run this script again');
    }

    console.log('✅ Assignment process completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

assignExistingCasesToInstructors();
