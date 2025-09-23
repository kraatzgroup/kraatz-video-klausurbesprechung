#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function testResultsDisplay() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Test different scenarios for ResultsPage display
    console.log('\n🧪 Testing ResultsPage display scenarios...\n');

    // Scenario 1: User with no results
    console.log('📋 Scenario 1: User with NO results');
    const noResultsQuery = await client.query(`
      SELECT COUNT(*) as count
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      INNER JOIN users u ON csr.user_id = u.id
      WHERE u.role = 'student'
        AND s.status = 'corrected'
        AND s.grade IS NOT NULL
        AND u.email = 'nonexistent@example.com'
    `);
    console.log(`   Results: ${noResultsQuery.rows[0].count} → Should show "Noch keine Ergebnisse"`);

    // Scenario 2: User with exactly 1 result (Charlene)
    console.log('\n📋 Scenario 2: User with EXACTLY 1 result (Charlene)');
    const oneResultQuery = await client.query(`
      SELECT 
        COUNT(*) as count,
        AVG(s.grade) as avg_grade,
        STRING_AGG(DISTINCT csr.legal_area, ', ') as legal_areas
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      INNER JOIN users u ON csr.user_id = u.id
      WHERE u.email = 'charlenenowak@gmx.de'
        AND s.status = 'corrected'
        AND s.grade IS NOT NULL
    `);
    console.log(`   Results: ${oneResultQuery.rows[0].count} → Should show FULL LAYOUT`);
    console.log(`   Average: ${parseFloat(oneResultQuery.rows[0].avg_grade).toFixed(2)} points`);
    console.log(`   Legal Areas: ${oneResultQuery.rows[0].legal_areas}`);

    // Scenario 3: User with multiple results (Demo User)
    console.log('\n📋 Scenario 3: User with MULTIPLE results (Demo User)');
    const multipleResultsQuery = await client.query(`
      SELECT 
        COUNT(*) as count,
        AVG(s.grade) as avg_grade,
        STRING_AGG(DISTINCT csr.legal_area, ', ') as legal_areas
      FROM submissions s
      INNER JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      INNER JOIN users u ON csr.user_id = u.id
      WHERE u.email = 'demo@kraatz-club.de'
        AND s.status = 'corrected'
        AND s.grade IS NOT NULL
    `);
    console.log(`   Results: ${multipleResultsQuery.rows[0].count} → Should show FULL LAYOUT`);
    console.log(`   Average: ${parseFloat(multipleResultsQuery.rows[0].avg_grade).toFixed(2)} points`);
    console.log(`   Legal Areas: ${multipleResultsQuery.rows[0].legal_areas}`);

    // Test the exact query used by ResultsPage
    console.log('\n🔍 Testing exact ResultsPage query for Charlene...');
    const charleneUser = await client.query(`
      SELECT id FROM users WHERE email = 'charlenenowak@gmx.de'
    `);

    if (charleneUser.rows.length > 0) {
      const userId = charleneUser.rows[0].id;
      const resultsPageQuery = await client.query(`
        SELECT 
          s.id,
          s.grade,
          s.grade_text,
          s.corrected_at,
          s.submitted_at,
          s.correction_video_url,
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
        ORDER BY s.corrected_at DESC
      `, [userId]);

      console.log(`   Query returned: ${resultsPageQuery.rows.length} results`);
      
      if (resultsPageQuery.rows.length > 0) {
        console.log('   ✅ FULL LAYOUT will be displayed');
        console.log('   📊 Components that will show:');
        console.log('      - Header: "Meine Klausurergebnisse"');
        console.log('      - Statistics cards (4 cards)');
        console.log('      - Progress chart (line chart)');
        console.log('      - Individual exam cards');
        console.log('      - Legal area breakdown');
        
        resultsPageQuery.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.grade} points - ${row.legal_area} (${new Date(row.corrected_at).toLocaleDateString()})`);
        });
      } else {
        console.log('   ❌ "Noch keine Ergebnisse" will be displayed');
      }
    }

    console.log('\n✅ Display Logic Summary:');
    console.log('   📊 results.length === 0 → "Noch keine Ergebnisse"');
    console.log('   📈 results.length >= 1  → FULL LAYOUT (like Demo User)');
    console.log('   🎯 This ensures consistent experience for ALL students');

  } catch (error) {
    console.error('❌ Error testing results display:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testResultsDisplay();
