require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function testEmailNotifications() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create or get test user with charlenenowak@gmx.de email
    const testEmail = 'charlenenowak@gmx.de';
    
    // First, check if user exists
    let testUser;
    const getUserQuery = `SELECT id, email, first_name, last_name, role FROM users WHERE email = $1`;
    const userResult = await client.query(getUserQuery, [testEmail]);
    
    if (userResult.rows.length === 0) {
      // Create test user if doesn't exist
      const createUserQuery = `
        INSERT INTO users (email, first_name, last_name, role, account_credits)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, role
      `;
      const createResult = await client.query(createUserQuery, [
        testEmail,
        'Charlene',
        'Nowak (Test)',
        'student',
        100
      ]);
      testUser = createResult.rows[0];
      testUser.full_name = `${testUser.first_name} ${testUser.last_name}`;
      console.log(`✅ Created test user: ${testUser.full_name} (${testUser.email})`);
    } else {
      testUser = userResult.rows[0];
      testUser.full_name = `${testUser.first_name} ${testUser.last_name}`;
      console.log(`✅ Found existing test user: ${testUser.full_name} (${testUser.email})`);
    }

    // Get a sample case study ID for related notifications
    const caseStudyQuery = `SELECT id FROM case_study_requests LIMIT 1`;
    const caseStudyResult = await client.query(caseStudyQuery);
    const caseStudyId = caseStudyResult.rows[0]?.id || null;

    console.log(`\n📧 Testing all email notification scenarios for: ${testEmail}`);

    const notificationQuery = `
      INSERT INTO notifications (user_id, title, message, type, read, related_case_study_id)
      VALUES ($1, $2, $3, $4, false, $5)
      RETURNING id
    `;

    // Test scenarios based on the Edge Function logic
    const testScenarios = [
      {
        name: 'Scenario 1: New Case Study Available',
        title: '📚 Sachverhalt verfügbar',
        message: 'Ihr Sachverhalt für Zivilrecht - Vertragsrecht ist jetzt verfügbar und kann bearbeitet werden.',
        type: 'success'
      },
      {
        name: 'Scenario 2: Correction Available',
        title: '🎓 Korrektur verfügbar',
        message: 'Die Korrektur für Zivilrecht - Vertragsrecht ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.',
        type: 'success'
      },
      {
        name: 'Scenario 3: Submission Confirmed',
        title: '✅ Bearbeitung eingereicht',
        message: 'Ihre Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.',
        type: 'info'
      },
      {
        name: 'Scenario 4: Case Study Completed',
        title: '🎉 Klausur abgeschlossen',
        message: 'Ihre Klausur für Zivilrecht - Vertragsrecht wurde erfolgreich abgeschlossen. Herzlichen Glückwunsch!',
        type: 'success'
      },
      {
        name: 'Scenario 5: Correction in Progress',
        title: '👨‍🏫 Korrektur in Bearbeitung',
        message: 'Ihr Dozent bearbeitet gerade Ihre Klausur. Die Korrektur wird bald verfügbar sein.',
        type: 'info'
      },
      {
        name: 'Scenario 6: Additional Materials Available',
        title: '📄 Zusätzliche Materialien verfügbar',
        message: 'Für Ihre Klausur stehen zusätzliche Materialien und Musterlösungen zur Verfügung.',
        type: 'info'
      }
    ];

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n🧪 ${scenario.name}...`);
      
      const result = await client.query(notificationQuery, [
        testUser.id,
        scenario.title,
        scenario.message,
        scenario.type,
        caseStudyId
      ]);

      console.log(`✅ Created notification with ID: ${result.rows[0].id}`);
      
      // Wait between notifications to avoid overwhelming the email system
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 All test email scenarios sent successfully!');
    console.log(`\n📬 Check the email inbox for: ${testEmail}`);
    console.log('\n💡 You can also check the Supabase Edge Function logs in the dashboard:');
    console.log('   https://supabase.com/dashboard/project/rpgbyockvpannrupicno/functions');
    console.log('\n📋 Test scenarios sent:');
    testScenarios.forEach((scenario, index) => {
      console.log(`   ${index + 1}. ${scenario.name}`);
    });

  } catch (error) {
    console.error('❌ Error testing email notifications:', error);
  } finally {
    await client.end();
  }
}

testEmailNotifications();
