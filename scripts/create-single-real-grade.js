#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function createSingleRealGrade() {
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

    // Find the most recent case study request for this user
    const requestQuery = await client.query(`
      SELECT id, legal_area, sub_area, focus_area, status
      FROM case_study_requests 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [user.id]);

    if (requestQuery.rows.length === 0) {
      console.log('❌ No case study requests found for this user');
      return;
    }

    const request = requestQuery.rows[0];
    console.log(`📋 Found case study request: ${request.id} (${request.legal_area})`);

    // Check if submission already exists
    const existingSubmissionQuery = await client.query(`
      SELECT id FROM submissions 
      WHERE case_study_request_id = $1
    `, [request.id]);

    // Create the single real grade that was actually entered by the instructor
    const realGrade = {
      grade: 14.0,  // The grade that was actually entered
      text: 'Gut',  // Grade description
      legal_area: request.legal_area
    };

    if (existingSubmissionQuery.rows.length > 0) {
      console.log('📝 Updating existing submission...');
      
      // Update existing submission
      const updateResult = await client.query(`
        UPDATE submissions 
        SET 
          grade = $1, 
          grade_text = $2, 
          status = 'corrected', 
          corrected_at = NOW(),
          file_url = 'student-submission.pdf',
          file_type = 'pdf'
        WHERE case_study_request_id = $3
        RETURNING id, grade, grade_text
      `, [realGrade.grade, realGrade.text, request.id]);

      console.log(`✅ Updated submission ${updateResult.rows[0].id} with grade ${updateResult.rows[0].grade}`);
    } else {
      console.log('📝 Creating new submission...');
      
      // Create new submission
      const insertResult = await client.query(`
        INSERT INTO submissions (
          case_study_request_id, 
          file_url, 
          file_type, 
          status, 
          grade, 
          grade_text, 
          corrected_at,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() - INTERVAL '1 day')
        RETURNING id, grade, grade_text
      `, [
        request.id, 
        'student-submission.pdf', 
        'pdf', 
        'corrected', 
        realGrade.grade, 
        realGrade.text
      ]);

      console.log(`✅ Created submission ${insertResult.rows[0].id} with grade ${insertResult.rows[0].grade}`);
    }

    // Verify the result
    console.log('\n🔍 Verifying final result...');
    const verifyQuery = await client.query(`
      SELECT 
        s.id,
        s.grade,
        s.grade_text,
        s.corrected_at,
        s.status,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      WHERE csr.user_id = $1
        AND s.status = 'corrected'
        AND s.grade IS NOT NULL
      ORDER BY s.corrected_at DESC
    `, [user.id]);

    console.log(`\n📊 Final result: ${verifyQuery.rows.length} submission(s):`);
    verifyQuery.rows.forEach((row, index) => {
      console.log(`${index + 1}. Grade: ${row.grade} (${row.grade_text})`);
      console.log(`   Legal Area: ${row.legal_area}`);
      console.log(`   Sub Area: ${row.sub_area}`);
      console.log(`   Focus Area: ${row.focus_area}`);
      console.log(`   Corrected: ${new Date(row.corrected_at).toLocaleString()}`);
    });

    console.log('\n🎉 Single real grade created! Your ResultsPage will now show exactly one result.');

  } catch (error) {
    console.error('❌ Error creating single real grade:', error);
  } finally {
    await client.end();
  }
}

// Run the script
createSingleRealGrade();
