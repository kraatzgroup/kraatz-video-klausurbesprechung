// Investigate why user deletion fails - check for foreign key constraints
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function investigateUserDeletionIssue() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const userId = '06135db2-3759-4394-acb4-3d41bf115bc5';
    
    console.log('🔍 Investigating user deletion issue for user ID:', userId);
    console.log('');

    // 1. Check if user exists in auth.users
    console.log('👤 Checking user in auth.users...');
    const authUserQuery = `
      SELECT id, email, created_at
      FROM auth.users 
      WHERE id = $1;
    `;
    
    const authUserResult = await client.query(authUserQuery, [userId]);
    
    if (authUserResult.rows.length === 0) {
      console.log('❌ User not found in auth.users');
      return;
    }

    const authUser = authUserResult.rows[0];
    console.log('✅ User found in auth.users:', authUser.email);
    console.log('');

    // 2. Check if user exists in public.users
    console.log('👤 Checking user in public.users...');
    const publicUserQuery = `
      SELECT id, email, role, first_name, last_name
      FROM users 
      WHERE id = $1;
    `;
    
    const publicUserResult = await client.query(publicUserQuery, [userId]);
    
    if (publicUserResult.rows.length === 0) {
      console.log('❌ User not found in public.users');
    } else {
      const publicUser = publicUserResult.rows[0];
      console.log('✅ User found in public.users:', `${publicUser.first_name} ${publicUser.last_name} (${publicUser.email}) - ${publicUser.role}`);
    }
    console.log('');

    // 3. Check for foreign key references that prevent deletion
    console.log('🔗 Checking for foreign key references...');
    
    // Check case_study_requests where user is assigned as instructor
    const assignedCasesQuery = `
      SELECT COUNT(*) as count
      FROM case_study_requests 
      WHERE assigned_instructor_id = $1;
    `;
    
    const assignedCasesResult = await client.query(assignedCasesQuery, [userId]);
    const assignedCasesCount = assignedCasesResult.rows[0].count;
    
    console.log(`📋 Assigned case studies: ${assignedCasesCount}`);
    
    if (assignedCasesCount > 0) {
      console.log('⚠️  This user has assigned case studies - this prevents deletion');
      
      // Show the assigned cases
      const casesDetailsQuery = `
        SELECT 
          csr.id,
          csr.legal_area,
          csr.sub_area,
          csr.status,
          u.email as student_email
        FROM case_study_requests csr
        JOIN users u ON csr.user_id = u.id
        WHERE csr.assigned_instructor_id = $1
        ORDER BY csr.created_at DESC;
      `;
      
      const casesDetailsResult = await client.query(casesDetailsQuery, [userId]);
      
      console.log('📋 Assigned cases details:');
      casesDetailsResult.rows.forEach(caseStudy => {
        console.log(`  - ${caseStudy.legal_area} - ${caseStudy.sub_area} (${caseStudy.student_email}) - ${caseStudy.status}`);
      });
    }
    console.log('');

    // Check case_study_requests where user is the student
    const studentCasesQuery = `
      SELECT COUNT(*) as count
      FROM case_study_requests 
      WHERE user_id = $1;
    `;
    
    const studentCasesResult = await client.query(studentCasesQuery, [userId]);
    const studentCasesCount = studentCasesResult.rows[0].count;
    
    console.log(`📚 Student case studies: ${studentCasesCount}`);
    
    if (studentCasesCount > 0) {
      console.log('⚠️  This user has case studies as a student - this prevents deletion');
    }
    console.log('');

    // Check notifications
    const notificationsQuery = `
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE user_id = $1;
    `;
    
    const notificationsResult = await client.query(notificationsQuery, [userId]);
    const notificationsCount = notificationsResult.rows[0].count;
    
    console.log(`🔔 Notifications: ${notificationsCount}`);
    console.log('');

    // 4. Provide solution
    console.log('💡 SOLUTION:');
    
    if (assignedCasesCount > 0) {
      console.log('🔧 Before deleting this instructor, you need to:');
      console.log('   1. Reassign their case studies to another instructor');
      console.log('   2. Or set assigned_instructor_id to NULL for their cases');
      console.log('');
      console.log('🛠️  SQL to reassign cases to another instructor:');
      console.log(`   UPDATE case_study_requests SET assigned_instructor_id = 'new_instructor_id' WHERE assigned_instructor_id = '${userId}';`);
      console.log('');
      console.log('🛠️  SQL to unassign cases (admin can reassign later):');
      console.log(`   UPDATE case_study_requests SET assigned_instructor_id = NULL WHERE assigned_instructor_id = '${userId}';`);
    }
    
    if (studentCasesCount > 0) {
      console.log('⚠️  This user has case studies as a student - consider if deletion is appropriate');
      console.log('   Student data deletion may affect historical records');
    }
    
    if (notificationsCount > 0) {
      console.log('🔔 User has notifications - these will be cascade deleted');
    }
    
    if (assignedCasesCount === 0 && studentCasesCount === 0) {
      console.log('✅ No foreign key constraints found - deletion should work');
      console.log('   The error might be due to other constraints or permissions');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

investigateUserDeletionIssue();
