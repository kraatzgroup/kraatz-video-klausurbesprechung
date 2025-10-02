const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function sendTestReminderEmail() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Create test data for the email
    const testData = {
      user: {
        email: 'charlenenowak@gmx.de',
        first_name: 'Charlene',
        last_name: 'Nowak'
      },
      caseStudy: {
        legal_area: 'Zivilrecht',
        sub_area: 'BGB AT',
        focus_area: 'Willenserklärung',
        case_study_number: 42
      },
      feedback: {
        mistakes_learned: 'Ich habe die Anfechtung wegen Irrtums nicht vollständig geprüft und wichtige Voraussetzungen übersehen. Besonders die Unterscheidung zwischen Inhalts- und Erklärungsirrtum war mir nicht klar genug.',
        improvements_planned: 'Ich werde in Zukunft systematischer vorgehen und eine Checkliste für die Anfechtungsprüfung verwenden. Außerdem möchte ich die verschiedenen Irrtumsarten nochmals intensiv wiederholen.',
        review_date: new Date().toISOString().split('T')[0] // Today's date
      }
    };

    console.log('📧 Preparing test reminder email...');
    console.log(`📤 Recipient: ${testData.user.email}`);
    console.log(`📚 Case Study: ${testData.caseStudy.legal_area} - ${testData.caseStudy.sub_area}`);
    console.log(`📅 Review Date: ${testData.feedback.review_date}`);

    // Generate the email HTML content
    const emailSubject = `🎓 Kraatz Club - Wiederholungserinnerung für ${testData.caseStudy.legal_area}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎓 Kraatz Club</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Dein Weg zum erfolgreichen Staatsexamen</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1E40AF; margin-top: 0;">📅 Wiederholungserinnerung (TEST)</h2>
          
          <div style="background: #FFF3CD; border: 1px solid #FFEAA7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              ⚠️ Dies ist eine Test-E-Mail für das Erinnerungssystem
            </p>
          </div>
          
          <p>Hallo ${testData.user.first_name},</p>
          
          <p>heute ist der Tag, an dem du dir vorgenommen hattest, die Inhalte deiner Klausur zu wiederholen!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">📚 Klausur-Details:</h3>
            <p><strong>Rechtsgebiet:</strong> ${testData.caseStudy.legal_area}</p>
            <p><strong>Teilgebiet:</strong> ${testData.caseStudy.sub_area}</p>
            <p><strong>Schwerpunkt:</strong> ${testData.caseStudy.focus_area}</p>
            <p><strong>Klausur #:</strong> ${testData.caseStudy.case_study_number}</p>
          </div>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h4 style="margin-top: 0; color: #DC2626;">💡 Deine Erkenntnisse:</h4>
            <p style="font-style: italic;">"${testData.feedback.mistakes_learned}"</p>
          </div>
          
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E;">
            <h4 style="margin-top: 0; color: #16A34A;">🎯 Deine Verbesserungsziele:</h4>
            <p style="font-style: italic;">"${testData.feedback.improvements_planned}"</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://kraatz-club.com/dashboard" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              📖 Zum Dashboard
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Nutze diese Gelegenheit, um dein Wissen zu festigen und dich optimal auf das Staatsexamen vorzubereiten!
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <div style="background: #FFF3CD; border: 1px solid #FFEAA7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
              <strong>🧪 TEST-E-MAIL</strong><br>
              Diese E-Mail wurde zu Testzwecken generiert.<br>
              Gesendet am: ${new Date().toLocaleString('de-DE')}
            </p>
          </div>
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Diese E-Mail wurde automatisch von Kraatz Club gesendet.<br>
            Du erhältst diese Nachricht, weil eine Test-Erinnerung angefordert wurde.
          </p>
        </div>
      </div>
    `;

    // For testing purposes, we'll just log the email content
    // In production, this would be sent via an email service
    console.log('\n📧 TEST EMAIL CONTENT:');
    console.log('='.repeat(50));
    console.log(`To: ${testData.user.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log('\nHTML Content:');
    console.log(emailHtml);
    console.log('='.repeat(50));

    // Save the test email to a file for preview
    const fs = require('fs');
    const path = require('path');
    
    const emailPreviewPath = path.join(__dirname, 'test-reminder-email-preview.html');
    fs.writeFileSync(emailPreviewPath, emailHtml);
    
    console.log(`\n📄 Email preview saved to: ${emailPreviewPath}`);
    console.log('💡 Open this file in a browser to see how the email looks!');

    // Simulate sending via console output
    console.log('\n📤 SIMULATED EMAIL SEND:');
    console.log(`✅ Test reminder email would be sent to: ${testData.user.email}`);
    console.log(`📧 Subject: ${emailSubject}`);
    console.log(`📅 Review Date: ${testData.feedback.review_date}`);
    console.log(`📚 Case Study: ${testData.caseStudy.legal_area} - ${testData.caseStudy.sub_area}`);

    // In a real implementation, you would call your email service here:
    /*
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kraatz Club <noreply@kraatz-club.com>',
        to: testData.user.email,
        subject: emailSubject,
        html: emailHtml,
      }),
    });
    */

    console.log('\n🎉 Test email preparation completed successfully!');
    console.log('\n📋 Next steps to actually send emails:');
    console.log('1. Set up an email service (Resend, SendGrid, etc.)');
    console.log('2. Add API keys to environment variables');
    console.log('3. Deploy the Supabase Edge Function');
    console.log('4. Set up the daily cron job');

  } catch (error) {
    console.error('❌ Error preparing test reminder email:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
sendTestReminderEmail()
  .then(() => {
    console.log('\n✅ Test reminder email preparation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test reminder email preparation failed:', error);
    process.exit(1);
  });
