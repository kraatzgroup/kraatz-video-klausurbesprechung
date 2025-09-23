#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function debugGrades() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check submissions table
    console.log('\n📊 Checking submissions table...');
    const submissionsQuery = `
      SELECT 
        s.id,
        s.case_study_request_id,
        s.status,
        s.grade,
        s.grade_text,
        s.corrected_at,
        csr.user_id,
        csr.legal_area,
        u.email,
        u.first_name,
        u.last_name
      FROM submissions s
      JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      JOIN users u ON csr.user_id = u.id
      WHERE s.grade IS NOT NULL
      ORDER BY s.corrected_at DESC
      LIMIT 10;
    `;

    const submissionsResult = await client.query(submissionsQuery);
    console.log(`Found ${submissionsResult.rows.length} submissions with grades:`);
    
    submissionsResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Submission ID: ${row.id}`);
      console.log(`   Student: ${row.first_name} ${row.last_name} (${row.email})`);
      console.log(`   Legal Area: ${row.legal_area}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Grade: ${row.grade}`);
      console.log(`   Grade Text: ${row.grade_text || 'None'}`);
      console.log(`   Corrected At: ${row.corrected_at}`);
    });

    // Check case study requests
    console.log('\n📋 Checking case study requests...');
    const requestsQuery = `
      SELECT 
        csr.id,
        csr.user_id,
        csr.status,
        csr.legal_area,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(s.id) as submission_count
      FROM case_study_requests csr
      JOIN users u ON csr.user_id = u.id
      LEFT JOIN submissions s ON csr.id = s.case_study_request_id
      WHERE u.role = 'student'
      GROUP BY csr.id, csr.user_id, csr.status, csr.legal_area, u.email, u.first_name, u.last_name
      ORDER BY csr.created_at DESC
      LIMIT 10;
    `;

    const requestsResult = await client.query(requestsQuery);
    console.log(`\nFound ${requestsResult.rows.length} case study requests:`);
    
    requestsResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Request ID: ${row.id}`);
      console.log(`   Student: ${row.first_name} ${row.last_name} (${row.email})`);
      console.log(`   Legal Area: ${row.legal_area}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Submissions: ${row.submission_count}`);
    });

    // Test the exact query from ResultsPage
    console.log('\n🔍 Testing ResultsPage query...');
    
    // Get a student user ID for testing
    const studentQuery = await client.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE role = 'student' 
      LIMIT 1
    `);

    if (studentQuery.rows.length > 0) {
      const studentId = studentQuery.rows[0].id;
      console.log(`Testing with student: ${studentQuery.rows[0].first_name} ${studentQuery.rows[0].last_name} (${studentQuery.rows[0].email})`);

      const resultsQuery = `
        SELECT 
          s.id,
          s.grade,
          s.grade_text,
          s.corrected_at,
          s.submitted_at,
          s.correction_video_url,
          s.status,
          csr.legal_area,
          csr.sub_area,
          csr.focus_area,
          csr.created_at,
          csr.user_id
        FROM submissions s
        INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
        WHERE csr.user_id = $1
          AND s.status = 'corrected'
          AND s.grade IS NOT NULL
        ORDER BY s.corrected_at DESC;
      `;

      const resultsResult = await client.query(resultsQuery, [studentId]);
      console.log(`\nResultsPage query returned ${resultsResult.rows.length} results:`);
      
      resultsResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Result:`);
        console.log(`   Grade: ${row.grade}`);
        console.log(`   Legal Area: ${row.legal_area}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Corrected At: ${row.corrected_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging grades:', error);
  } finally {
    await client.end();
  }
}

// Run the debug
debugGrades();
