// Reassign cases from Adria 55 to Prof. Kraatz before deletion
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function reassignCasesBeforeDeletion() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const userToDelete = '06135db2-3759-4394-acb4-3d41bf115bc5'; // Adria 55
    const newInstructorEmail = 'dozent@kraatz-club.de'; // Prof. Kraatz
    
    console.log('🔄 Reassigning cases before user deletion...');
    console.log('From: Adria 55 (adria55@tiffincrane.com)');
    console.log('To: Prof. Kraatz (dozent@kraatz-club.de)');
    console.log('');

    // 1. Get the new instructor's ID
    const newInstructorQuery = `
      SELECT id, email, first_name, last_name, instructor_legal_area
      FROM users 
      WHERE email = $1;
    `;
    
    const newInstructorResult = await client.query(newInstructorQuery, [newInstructorEmail]);
    
    if (newInstructorResult.rows.length === 0) {
      console.log('❌ New instructor not found:', newInstructorEmail);
      return;
    }

    const newInstructor = newInstructorResult.rows[0];
    console.log('✅ New instructor found:', `${newInstructor.first_name} ${newInstructor.last_name} (${newInstructor.email})`);
    console.log('   Legal Area:', newInstructor.instructor_legal_area);
    console.log('');

    // 2. Get cases assigned to the user to be deleted
    const assignedCasesQuery = `
      SELECT 
        csr.id,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area,
        csr.status,
        u.email as student_email,
        u.first_name as student_first_name,
        u.last_name as student_last_name
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      WHERE csr.assigned_instructor_id = $1;
    `;
    
    const assignedCasesResult = await client.query(assignedCasesQuery, [userToDelete]);
    
    console.log(`📋 Found ${assignedCasesResult.rows.length} cases to reassign:`);
    
    if (assignedCasesResult.rows.length === 0) {
      console.log('✅ No cases to reassign - user can be deleted safely');
      return;
    }

    // 3. Show cases and reassign them
    for (const caseStudy of assignedCasesResult.rows) {
      console.log(`📝 Reassigning Case ID: ${caseStudy.id}`);
      console.log(`   ${caseStudy.legal_area} - ${caseStudy.sub_area} (${caseStudy.focus_area})`);
      console.log(`   Student: ${caseStudy.student_first_name} ${caseStudy.student_last_name} (${caseStudy.student_email})`);
      console.log(`   Status: ${caseStudy.status}`);
      
      // Check if legal areas match
      if (caseStudy.legal_area !== newInstructor.instructor_legal_area) {
        console.log(`   ⚠️  Legal area mismatch: Case is ${caseStudy.legal_area}, Instructor is ${newInstructor.instructor_legal_area}`);
        console.log('   Reassigning anyway - admin can fix later if needed');
      }

      // Reassign the case
      const reassignQuery = `
        UPDATE case_study_requests 
        SET 
          assigned_instructor_id = $1,
          updated_at = NOW()
        WHERE id = $2;
      `;
      
      const reassignResult = await client.query(reassignQuery, [newInstructor.id, caseStudy.id]);
      
      if (reassignResult.rowCount === 1) {
        console.log('   ✅ Successfully reassigned');
      } else {
        console.log('   ❌ Reassignment failed');
      }
      console.log('');
    }

    // 4. Verify no cases are left assigned to the user
    const remainingCasesQuery = `
      SELECT COUNT(*) as count
      FROM case_study_requests 
      WHERE assigned_instructor_id = $1;
    `;
    
    const remainingResult = await client.query(remainingCasesQuery, [userToDelete]);
    const remainingCount = remainingResult.rows[0].count;
    
    console.log('🔍 Verification:');
    console.log(`   Remaining assigned cases: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ All cases successfully reassigned!');
      console.log('');
      console.log('🎯 User can now be deleted safely from the admin interface');
      console.log('   The database constraints have been resolved');
    } else {
      console.log('❌ Some cases are still assigned - deletion will still fail');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

reassignCasesBeforeDeletion();
