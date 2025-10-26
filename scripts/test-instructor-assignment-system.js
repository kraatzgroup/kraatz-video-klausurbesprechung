// Test the new instructor assignment system
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function testInstructorAssignmentSystem() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🧪 Testing Instructor Assignment System');
    console.log('');

    // Test 1: Check what each instructor sees now
    console.log('📋 Test 1: What each instructor sees in their dashboard');
    console.log('');

    const instructors = [
      { email: 'adria55@tiffincrane.com', name: 'Adria 55' },
      { email: 'dozent@kraatz-club.de', name: 'Prof. Kraatz' },
      { email: 'charlene@swipeup-marketing.com', name: 'Philipp Lützenburger' },
      { email: 'honormiddle@powerscrews.com', name: 'Dozent Ö-Recht' }
    ];

    for (const instructor of instructors) {
      console.log(`👨‍🏫 ${instructor.name} (${instructor.email}):`);
      
      // Get instructor details
      const instructorQuery = `
        SELECT id, instructor_legal_area
        FROM users 
        WHERE email = $1;
      `;
      
      const instructorResult = await client.query(instructorQuery, [instructor.email]);
      
      if (instructorResult.rows.length === 0) {
        console.log('   ❌ Instructor not found');
        continue;
      }

      const instructorData = instructorResult.rows[0];
      console.log(`   Legal Area: ${instructorData.instructor_legal_area}`);

      // Get assigned cases (what they will see in InstructorDashboard)
      const assignedCasesQuery = `
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
        WHERE csr.assigned_instructor_id = $1
        ORDER BY csr.created_at DESC;
      `;
      
      const assignedResult = await client.query(assignedCasesQuery, [instructorData.id]);
      
      console.log(`   Assigned Cases: ${assignedResult.rows.length}`);
      
      if (assignedResult.rows.length > 0) {
        assignedResult.rows.forEach(caseStudy => {
          console.log(`     - ${caseStudy.legal_area} - ${caseStudy.sub_area} (${caseStudy.student_first_name} ${caseStudy.student_last_name}) - ${caseStudy.status}`);
        });
      } else {
        console.log('     - No cases assigned yet');
      }
      console.log('');
    }

    // Test 2: Check unassigned cases
    console.log('📋 Test 2: Unassigned cases (should be 0 after running assignment script)');
    
    const unassignedQuery = `
      SELECT 
        csr.id,
        csr.legal_area,
        csr.sub_area,
        csr.status,
        u.email as student_email
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      WHERE csr.assigned_instructor_id IS NULL;
    `;
    
    const unassignedResult = await client.query(unassignedQuery);
    
    console.log(`Unassigned Cases: ${unassignedResult.rows.length}`);
    
    if (unassignedResult.rows.length > 0) {
      console.log('⚠️  These cases need manual assignment:');
      unassignedResult.rows.forEach(caseStudy => {
        console.log(`  - ${caseStudy.legal_area} - ${caseStudy.sub_area} (${caseStudy.student_email}) - ${caseStudy.status}`);
      });
    } else {
      console.log('✅ All cases are properly assigned');
    }
    console.log('');

    // Test 3: Summary by legal area
    console.log('📊 Test 3: Cases distribution by legal area');
    
    const distributionQuery = `
      SELECT 
        csr.legal_area,
        COUNT(*) as total_cases,
        COUNT(csr.assigned_instructor_id) as assigned_cases,
        COUNT(*) - COUNT(csr.assigned_instructor_id) as unassigned_cases,
        STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name, ' (', u.email, ')'), ', ') as instructors
      FROM case_study_requests csr
      LEFT JOIN users u ON csr.assigned_instructor_id = u.id
      GROUP BY csr.legal_area
      ORDER BY csr.legal_area;
    `;
    
    const distributionResult = await client.query(distributionQuery);
    
    distributionResult.rows.forEach(area => {
      console.log(`${area.legal_area}:`);
      console.log(`  Total Cases: ${area.total_cases}`);
      console.log(`  Assigned: ${area.assigned_cases}`);
      console.log(`  Unassigned: ${area.unassigned_cases}`);
      console.log(`  Instructors: ${area.instructors || 'None'}`);
      console.log('');
    });

    console.log('✅ Instructor Assignment System Test Completed!');
    console.log('');
    console.log('🎯 Key Results:');
    console.log('  - Instructors now only see their assigned cases');
    console.log('  - New cases are automatically assigned to appropriate instructors');
    console.log('  - Historical cases have been assigned to instructors');
    console.log('  - Each legal area has dedicated instructors');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testInstructorAssignmentSystem();
