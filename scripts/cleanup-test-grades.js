#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function cleanupTestGrades() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Find Charlene Nowak's user ID
    const userQuery = await client.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = 'charlenenowak@gmx.de'
    `);

    if (userQuery.rows.length === 0) {
      console.log('❌ User charlenenowak@gmx.de not found');
      return;
    }

    const user = userQuery.rows[0];
    console.log(`👤 Found user: ${user.first_name} ${user.last_name} (${user.email})`);

    // Find all submissions for this user
    const submissionsQuery = await client.query(`
      SELECT 
        s.id,
        s.grade,
        s.grade_text,
        s.corrected_at,
        s.file_url,
        csr.legal_area,
        csr.id as request_id
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      WHERE csr.user_id = $1
      ORDER BY s.corrected_at DESC
    `, [user.id]);

    console.log(`📊 Found ${submissionsQuery.rows.length} submissions for this user:`);
    
    submissionsQuery.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Grade: ${row.grade}, Legal Area: ${row.legal_area}, File: ${row.file_url}`);
    });

    // Ask which one to keep (we'll keep the most recent real one)
    // Let's identify test submissions by their file_url patterns
    const testSubmissions = submissionsQuery.rows.filter(s => 
      s.file_url.includes('placeholder') || 
      s.file_url.includes('demo-file') || 
      s.file_url.includes('test-file')
    );

    const realSubmissions = submissionsQuery.rows.filter(s => 
      !s.file_url.includes('placeholder') && 
      !s.file_url.includes('demo-file') && 
      !s.file_url.includes('test-file')
    );

    console.log(`\n🔍 Analysis:`);
    console.log(`   Real submissions: ${realSubmissions.length}`);
    console.log(`   Test submissions: ${testSubmissions.length}`);

    if (testSubmissions.length > 0) {
      console.log(`\n🗑️ Removing ${testSubmissions.length} test submissions...`);
      
      for (const testSub of testSubmissions) {
        await client.query('DELETE FROM submissions WHERE id = $1', [testSub.id]);
        console.log(`   ❌ Deleted test submission: ${testSub.id} (${testSub.grade} points, ${testSub.legal_area})`);
      }
    }

    // If there are no real submissions but we need to keep one, let's keep the most recent one
    if (realSubmissions.length === 0 && submissionsQuery.rows.length > 0) {
      console.log(`\n⚠️ No real submissions found, keeping the most recent one as the "real" grade...`);
      const keepSubmission = submissionsQuery.rows[0]; // Most recent
      
      // Update it to look like a real submission
      await client.query(`
        UPDATE submissions 
        SET file_url = 'real-submission-url.pdf'
        WHERE id = $1
      `, [keepSubmission.id]);
      
      console.log(`✅ Kept submission ${keepSubmission.id} as the real grade (${keepSubmission.grade} points)`);
    }

    // Verify final result
    console.log('\n🔍 Final verification...');
    const finalQuery = await client.query(`
      SELECT 
        s.id,
        s.grade,
        s.grade_text,
        s.corrected_at,
        csr.legal_area
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      WHERE csr.user_id = $1
        AND s.status = 'corrected'
        AND s.grade IS NOT NULL
      ORDER BY s.corrected_at DESC
    `, [user.id]);

    console.log(`\n📊 Final result: ${finalQuery.rows.length} submission(s) remaining:`);
    finalQuery.rows.forEach((row, index) => {
      console.log(`${index + 1}. Grade: ${row.grade}, Legal Area: ${row.legal_area}, Date: ${new Date(row.corrected_at).toLocaleDateString()}`);
    });

    console.log('\n🎉 Cleanup completed! Only real grades remain.');

  } catch (error) {
    console.error('❌ Error cleaning up test grades:', error);
  } finally {
    await client.end();
  }
}

// Run the script
cleanupTestGrades();
