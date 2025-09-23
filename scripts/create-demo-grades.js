#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function createDemoGrades() {
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

    // Find all case study requests for this user
    const requestsQuery = await client.query(`
      SELECT id, legal_area, sub_area, focus_area, status
      FROM case_study_requests 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);

    console.log(`📋 Found ${requestsQuery.rows.length} case study requests`);

    // Demo grades data - similar to demo student
    const demoGrades = [
      { grade: 15.5, text: 'Sehr gut', dateOffset: -1 }, // 1 day ago
      { grade: 14.0, text: 'Gut', dateOffset: -7 }, // 1 week ago  
      { grade: 12.5, text: 'Befriedigend', dateOffset: -14 }, // 2 weeks ago
      { grade: 16.0, text: 'Sehr gut', dateOffset: -21 }, // 3 weeks ago
      { grade: 13.5, text: 'Gut', dateOffset: -30 }, // 1 month ago
      { grade: 11.0, text: 'Ausreichend', dateOffset: -45 } // 1.5 months ago
    ];

    let gradeIndex = 0;
    
    for (const request of requestsQuery.rows) {
      if (gradeIndex >= demoGrades.length) break;

      const gradeData = demoGrades[gradeIndex];
      
      // Check if submission already exists
      const existingSubmissionQuery = await client.query(`
        SELECT id FROM submissions 
        WHERE case_study_request_id = $1
      `, [request.id]);

      const correctedDate = new Date();
      correctedDate.setDate(correctedDate.getDate() + gradeData.dateOffset);

      if (existingSubmissionQuery.rows.length > 0) {
        console.log(`📝 Updating existing submission for request ${request.id} (${request.legal_area})`);
        
        // Update existing submission
        await client.query(`
          UPDATE submissions 
          SET grade = $1, grade_text = $2, status = 'corrected', corrected_at = $3
          WHERE case_study_request_id = $4
        `, [gradeData.grade, gradeData.text, correctedDate.toISOString(), request.id]);
      } else {
        console.log(`📝 Creating new submission for request ${request.id} (${request.legal_area})`);
        
        // Create new submission
        await client.query(`
          INSERT INTO submissions (
            case_study_request_id, 
            file_url, 
            file_type, 
            status, 
            grade, 
            grade_text, 
            corrected_at,
            submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          request.id, 
          'demo-file-url', 
          'pdf', 
          'corrected', 
          gradeData.grade, 
          gradeData.text, 
          correctedDate.toISOString(),
          new Date(correctedDate.getTime() - 24*60*60*1000).toISOString() // submitted 1 day before correction
        ]);
      }

      console.log(`✅ Grade ${gradeData.grade} (${gradeData.text}) added for ${request.legal_area}`);
      gradeIndex++;
    }

    // Verify the results
    console.log('\n🔍 Verifying all grades for this user...');
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

    console.log(`\n📊 Total results for ${user.email}: ${verifyQuery.rows.length}`);
    
    // Group by legal area for statistics
    const areaStats = {};
    verifyQuery.rows.forEach(row => {
      if (!areaStats[row.legal_area]) {
        areaStats[row.legal_area] = { grades: [], count: 0 };
      }
      areaStats[row.legal_area].grades.push(row.grade);
      areaStats[row.legal_area].count++;
    });

    console.log('\n📈 Statistics by Legal Area:');
    Object.entries(areaStats).forEach(([area, stats]) => {
      const avg = stats.grades.reduce((sum, grade) => sum + parseFloat(grade), 0) / stats.count;
      console.log(`   ${area}: ${stats.count} submissions, average: ${avg.toFixed(2)}`);
    });

    console.log('\n🎉 Demo grades created successfully! Your ResultsPage should now look like the demo student.');

  } catch (error) {
    console.error('❌ Error creating demo grades:', error);
  } finally {
    await client.end();
  }
}

// Run the script
createDemoGrades();
