// Investigate why new instructor sees existing case studies
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function investigateInstructorIsolation() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const newInstructorEmail = 'adria55@tiffincrane.com';
    const existingStudentEmail = 'charlenenowak@gmx.de';

    console.log('🔍 Investigating instructor isolation issue...');
    console.log('');

    // 1. Check the new instructor's details
    console.log('👨‍🏫 New Instructor Details:');
    const instructorQuery = `
      SELECT id, email, role, instructor_legal_area, first_name, last_name, created_at
      FROM users 
      WHERE email = $1;
    `;
    
    const instructorResult = await client.query(instructorQuery, [newInstructorEmail]);
    
    if (instructorResult.rows.length === 0) {
      console.log('❌ New instructor not found in users table');
      return;
    }

    const instructor = instructorResult.rows[0];
    console.log('  Email:', instructor.email);
    console.log('  Role:', instructor.role);
    console.log('  Legal Area:', instructor.instructor_legal_area || 'NOT SET');
    console.log('  Name:', `${instructor.first_name} ${instructor.last_name}`);
    console.log('  Created:', instructor.created_at);
    console.log('');

    // 2. Check the case study that's showing up
    console.log('📋 Case Study Details (Charlene Nowak - BGB AT):');
    const caseStudyQuery = `
      SELECT 
        csr.id,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area,
        csr.status,
        csr.created_at,
        csr.assigned_instructor_id,
        u.email as student_email,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        instructor.email as assigned_instructor_email,
        instructor.instructor_legal_area as assigned_instructor_legal_area
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      LEFT JOIN users instructor ON csr.assigned_instructor_id = instructor.id
      WHERE u.email = $1 
        AND csr.legal_area = 'Zivilrecht' 
        AND csr.sub_area = 'BGB AT'
      ORDER BY csr.created_at DESC
      LIMIT 1;
    `;
    
    const caseStudyResult = await client.query(caseStudyQuery, [existingStudentEmail]);
    
    if (caseStudyResult.rows.length === 0) {
      console.log('❌ Case study not found');
      return;
    }

    const caseStudy = caseStudyResult.rows[0];
    console.log('  ID:', caseStudy.id);
    console.log('  Legal Area:', caseStudy.legal_area);
    console.log('  Sub Area:', caseStudy.sub_area);
    console.log('  Focus Area:', caseStudy.focus_area);
    console.log('  Status:', caseStudy.status);
    console.log('  Created:', caseStudy.created_at);
    console.log('  Student:', `${caseStudy.student_first_name} ${caseStudy.student_last_name} (${caseStudy.student_email})`);
    console.log('  Assigned Instructor ID:', caseStudy.assigned_instructor_id || 'NOT ASSIGNED');
    console.log('  Assigned Instructor Email:', caseStudy.assigned_instructor_email || 'NOT ASSIGNED');
    console.log('  Assigned Instructor Legal Area:', caseStudy.assigned_instructor_legal_area || 'NOT SET');
    console.log('');

    // 3. Check what the InstructorDashboard query would return for the new instructor
    console.log('🔍 What InstructorDashboard query would return:');
    
    if (!instructor.instructor_legal_area) {
      console.log('❌ PROBLEM: New instructor has NO legal area assigned!');
      console.log('   This means they will see ALL case studies instead of filtered ones');
      console.log('');
      
      // Show what they would see
      const allCasesQuery = `
        SELECT COUNT(*) as total_cases
        FROM case_study_requests csr
        JOIN users u ON csr.user_id = u.id;
      `;
      
      const allCasesResult = await client.query(allCasesQuery);
      console.log('   They would see ALL', allCasesResult.rows[0].total_cases, 'case studies');
    } else {
      console.log('✅ Instructor has legal area:', instructor.instructor_legal_area);
      
      // Show what they should see (filtered)
      const filteredCasesQuery = `
        SELECT COUNT(*) as filtered_cases
        FROM case_study_requests csr
        JOIN users u ON csr.user_id = u.id
        WHERE csr.legal_area = $1;
      `;
      
      const filteredResult = await client.query(filteredCasesQuery, [instructor.instructor_legal_area]);
      console.log('   They should see only', filteredResult.rows[0].filtered_cases, 'case studies for', instructor.instructor_legal_area);
    }

    console.log('');
    console.log('🔧 DIAGNOSIS:');
    
    if (!instructor.instructor_legal_area) {
      console.log('❌ ROOT CAUSE: New instructor has no instructor_legal_area set');
      console.log('   Solution: Set instructor_legal_area for the new instructor');
      console.log('');
      console.log('💡 IMMEDIATE FIX:');
      console.log(`   UPDATE users SET instructor_legal_area = 'Zivilrecht' WHERE email = '${newInstructorEmail}';`);
    } else if (instructor.instructor_legal_area === caseStudy.legal_area) {
      console.log('⚠️  EXPECTED BEHAVIOR: Instructor should see this case study');
      console.log('   Both instructor and case study are in:', instructor.instructor_legal_area);
      console.log('   This is correct if the case study belongs to their legal area');
    } else {
      console.log('❌ FILTERING BUG: Instructor should NOT see this case study');
      console.log('   Instructor legal area:', instructor.instructor_legal_area);
      console.log('   Case study legal area:', caseStudy.legal_area);
      console.log('   Check InstructorDashboard.tsx filtering logic');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

investigateInstructorIsolation();
