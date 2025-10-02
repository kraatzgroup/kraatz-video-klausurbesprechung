// Einfacher E-Mail-Versand über Resend API
// Resend bietet 3000 kostenlose E-Mails pro Monat

const fetch = require('node-fetch');

async function sendEmailViaResend() {
  try {
    console.log('📧 Sending test email via Resend API...');
    
    // Resend API Key (kostenlos registrieren auf resend.com)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.log('\n❌ RESEND_API_KEY not found!');
      console.log('\n📋 To send emails via Resend:');
      console.log('1. Register at https://resend.com (free)');
      console.log('2. Create an API key');
      console.log('3. Set environment variable:');
      console.log('   export RESEND_API_KEY="re_your_api_key"');
      console.log('\n💡 Resend offers 3000 free emails per month');
      return;
    }

    // Test data
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
        review_date: new Date().toISOString().split('T')[0]
      }
    };

    // Email content
    const emailSubject = `🎓 Kraatz Club - Test-Wiederholungserinnerung für ${testData.caseStudy.legal_area}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎓 Kraatz Club</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Dein Weg zum erfolgreichen Staatsexamen</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1E40AF; margin-top: 0;">📅 Test-Wiederholungserinnerung</h2>
          
          <div style="background: #D1ECF1; border: 1px solid #BEE5EB; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #0C5460; font-weight: bold;">
              🧪 Dies ist eine echte Test-E-Mail vom Kraatz Club Erinnerungssystem!
            </p>
            <p style="margin: 5px 0 0 0; color: #0C5460; font-size: 14px;">
              Gesendet am: ${new Date().toLocaleString('de-DE')} via Resend API
            </p>
          </div>
          
          <p>Hallo ${testData.user.first_name},</p>
          
          <p>das E-Mail-Erinnerungssystem funktioniert perfekt! 🎉</p>
          
          <p>Diese E-Mail wurde erfolgreich über die Resend API versendet.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">📚 Beispiel-Klausur:</h3>
            <p><strong>Rechtsgebiet:</strong> ${testData.caseStudy.legal_area}</p>
            <p><strong>Teilgebiet:</strong> ${testData.caseStudy.sub_area}</p>
            <p><strong>Schwerpunkt:</strong> ${testData.caseStudy.focus_area}</p>
            <p><strong>Klausur #:</strong> ${testData.caseStudy.case_study_number}</p>
          </div>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h4 style="margin-top: 0; color: #DC2626;">💡 Beispiel - Erkenntnisse:</h4>
            <p style="font-style: italic;">"${testData.feedback.mistakes_learned}"</p>
          </div>
          
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E;">
            <h4 style="margin-top: 0; color: #16A34A;">🎯 Beispiel - Verbesserungsziele:</h4>
            <p style="font-style: italic;">"${testData.feedback.improvements_planned}"</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://kraatz-club.com/dashboard" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              📖 Zum Dashboard
            </a>
          </div>
          
          <div style="background: #E8F5E8; border: 1px solid #C3E6C3; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2D5A2D; font-size: 14px; text-align: center;">
              <strong>✅ E-Mail-System erfolgreich getestet!</strong><br>
              Das automatische Erinnerungssystem ist einsatzbereit.
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Wenn du bei deinen Feedbacks die E-Mail-Erinnerung aktivierst, 
            erhältst du automatisch solche personalisierten Erinnerungen.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Diese Test-E-Mail wurde vom Kraatz Club Erinnerungssystem gesendet.<br>
            Powered by Resend API
          </p>
        </div>
      </div>
    `;

    // Send via Resend API
    console.log(`📤 Sending to: ${testData.user.email}`);
    console.log(`📋 Subject: ${emailSubject}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kraatz Club <noreply@kraatz-club.com>',
        to: testData.user.email,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully via Resend!');
      console.log(`📧 Email ID: ${result.id}`);
      console.log(`📤 Sent to: ${testData.user.email}`);
      console.log('\n🎉 Real email test completed successfully!');
      console.log('📬 Check the inbox at charlenenowak@gmx.de');
    } else {
      console.error('❌ Failed to send email:', result);
      throw new Error(`Resend API error: ${result.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🔐 Invalid API key. Please check your RESEND_API_KEY');
    } else if (error.message.includes('domain')) {
      console.log('\n🌐 Domain verification required. Use a verified domain or sandbox mode');
    }
    
    throw error;
  }
}

// Check if node-fetch is available
try {
  require.resolve('node-fetch');
} catch (e) {
  console.log('❌ node-fetch is not installed');
  console.log('📦 Install it with: npm install node-fetch');
  process.exit(1);
}

// Run the test
sendEmailViaResend()
  .then(() => {
    console.log('\n✅ Resend email test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Resend email test failed:', error.message);
    process.exit(1);
  });
