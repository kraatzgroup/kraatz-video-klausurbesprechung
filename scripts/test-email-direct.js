const fetch = require('node-fetch');

async function testEmailNotificationsDirect() {
  const testEmail = 'charlenenowak@gmx.de';
  const edgeFunctionUrl = 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/notify-student';
  
  // Test scenarios that match the Edge Function logic
  const testScenarios = [
    {
      name: 'Scenario 1: New Case Study Available',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-1',
          user_id: 'test-user-id',
          title: '📚 Sachverhalt verfügbar',
          message: 'Ihr Sachverhalt für Zivilrecht - Vertragsrecht ist jetzt verfügbar und kann bearbeitet werden.',
          type: 'success',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    },
    {
      name: 'Scenario 2: Correction Available',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-2',
          user_id: 'test-user-id',
          title: '🎓 Korrektur verfügbar',
          message: 'Die Korrektur für Zivilrecht - Vertragsrecht ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.',
          type: 'success',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    },
    {
      name: 'Scenario 3: Submission Confirmed',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-3',
          user_id: 'test-user-id',
          title: '✅ Bearbeitung eingereicht',
          message: 'Ihre Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.',
          type: 'info',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    },
    {
      name: 'Scenario 4: Case Study Completed',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-4',
          user_id: 'test-user-id',
          title: '🎉 Klausur abgeschlossen',
          message: 'Ihre Klausur für Zivilrecht - Vertragsrecht wurde erfolgreich abgeschlossen. Herzlichen Glückwunsch!',
          type: 'success',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    },
    {
      name: 'Scenario 5: Correction in Progress',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-5',
          user_id: 'test-user-id',
          title: '👨‍🏫 Korrektur in Bearbeitung',
          message: 'Ihr Dozent bearbeitet gerade Ihre Klausur. Die Korrektur wird bald verfügbar sein.',
          type: 'info',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    },
    {
      name: 'Scenario 6: Additional Materials Available',
      payload: {
        type: 'INSERT',
        record: {
          id: 'test-6',
          user_id: 'test-user-id',
          title: '📄 Zusätzliche Materialien verfügbar',
          message: 'Für Ihre Klausur stehen zusätzliche Materialien und Musterlösungen zur Verfügung.',
          type: 'info',
          related_case_study_id: 'test-case-1',
          created_at: new Date().toISOString()
        }
      }
    }
  ];

  console.log(`📧 Testing email notifications directly to: ${testEmail}`);
  console.log(`🔗 Edge Function URL: ${edgeFunctionUrl}`);

  // First, we need to create a test user in the database and get their actual user ID
  const { Client } = require('pg');
  const client = new Client({
    connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    
    // Get or create test user
    const getUserQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await client.query(getUserQuery, [testEmail]);
    
    let userId;
    if (userResult.rows.length === 0) {
      const createUserQuery = `
        INSERT INTO users (email, first_name, last_name, role, account_credits)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const createResult = await client.query(createUserQuery, [
        testEmail,
        'Charlene',
        'Nowak (Test)',
        'student',
        100
      ]);
      userId = createResult.rows[0].id;
      console.log(`✅ Created test user with ID: ${userId}`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`✅ Found existing test user with ID: ${userId}`);
    }

    // Create a test case study for related notifications
    const createCaseQuery = `
      INSERT INTO case_study_requests (user_id, legal_area, sub_area, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    const caseResult = await client.query(createCaseQuery, [
      userId,
      'Zivilrecht',
      'Vertragsrecht',
      'materials_ready'
    ]);
    
    const caseStudyId = caseResult.rows[0]?.id || 'test-case-1';
    console.log(`✅ Using case study ID: ${caseStudyId}`);

    await client.end();

    // Now test each scenario by calling the Edge Function directly
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n🧪 ${scenario.name}...`);
      
      // Update the payload with real user ID and case study ID
      scenario.payload.record.user_id = userId;
      scenario.payload.record.related_case_study_id = caseStudyId;
      
      try {
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'}`
          },
          body: JSON.stringify(scenario.payload)
        });

        const result = await response.text();
        
        if (response.ok) {
          console.log(`✅ Email sent successfully`);
          console.log(`📧 Response: ${result}`);
        } else {
          console.log(`❌ Failed to send email: ${response.status}`);
          console.log(`📧 Error: ${result}`);
        }
      } catch (error) {
        console.log(`❌ Error calling Edge Function: ${error.message}`);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 All test email scenarios completed!');
    console.log(`\n📬 Check the email inbox for: ${testEmail}`);
    console.log('\n📋 Test scenarios sent:');
    testScenarios.forEach((scenario, index) => {
      console.log(`   ${index + 1}. ${scenario.name}`);
    });

  } catch (error) {
    console.error('❌ Error in email testing:', error);
  }
}

testEmailNotificationsDirect();
