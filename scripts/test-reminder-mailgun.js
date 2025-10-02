const FormData = require('form-data');
const fetch = require('node-fetch');

async function testReminderViaMailgun() {
  try {
    console.log('📧 Testing reminder email via Mailgun...');
    
    // Mailgun configuration (same as other notifications)
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = 'kraatz-group.de';
    
    if (!mailgunApiKey) {
      console.log('\n❌ MAILGUN_API_KEY not found!');
      console.log('\n📋 To send emails via Mailgun:');
      console.log('1. Get your Mailgun API key from the Kraatz Club Mailgun account');
      console.log('2. Set environment variable:');
      console.log('   export MAILGUN_API_KEY="your-mailgun-api-key"');
      console.log('\n💡 This uses the same Mailgun setup as other Kraatz Club notifications');
      return;
    }

    // Test data for charlenenowak@gmx.de
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

    console.log(`📤 Sending to: ${testData.user.email}`);
    console.log(`🔗 Using Mailgun domain: ${mailgunDomain}`);

    // Email content (same as Edge Function)
    const emailSubject = `Wiederholungserinnerung für ${testData.caseStudy.legal_area}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎓 Kraatz Club</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Dein Weg zum erfolgreichen Staatsexamen</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1E40AF; margin-top: 0;">📅 Wiederholungserinnerung</h2>
          
          <div style="background: #D1ECF1; border: 1px solid #BEE5EB; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #0C5460; font-weight: bold;">
              🧪 Dies ist eine Test-E-Mail über das Mailgun-System!
            </p>
            <p style="margin: 5px 0 0 0; color: #0C5460; font-size: 14px;">
              Gesendet am: ${new Date().toLocaleString('de-DE')} via Mailgun API
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
          
          <div style="background: #E8F5E8; border: 1px solid #C3E6C3; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2D5A2D; font-size: 14px; text-align: center;">
              <strong>✅ Mailgun-Integration erfolgreich getestet!</strong><br>
              Das E-Mail-Erinnerungssystem nutzt dieselbe Infrastruktur wie andere Kraatz Club Benachrichtigungen.
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Nutze diese Gelegenheit, um dein Wissen zu festigen und dich optimal auf das Staatsexamen vorzubereiten!
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Diese Test-E-Mail wurde automatisch von Kraatz Club gesendet.<br>
            Du erhältst diese Nachricht, weil eine Test-Erinnerung angefordert wurde.<br>
            Powered by Mailgun
          </p>
        </div>
      </div>
    `;

    // Send via Mailgun (same setup as other notifications)
    console.log('📤 Sending email via Mailgun...');
    
    const formData = new FormData();
    formData.append('from', 'Kraatz Club <noreply@kraatz-group.de>');
    formData.append('to', testData.user.email);
    formData.append('subject', `[Kraatz-Club] ${emailSubject}`);
    formData.append('html', emailHtml);

    const response = await fetch(
      `https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
        },
        body: formData
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully via Mailgun!');
      console.log(`📧 Mailgun ID: ${result.id}`);
      console.log(`📤 Sent to: ${testData.user.email}`);
      console.log(`📋 Subject: [Kraatz-Club] ${emailSubject}`);
      console.log(`🔗 Message: ${result.message}`);
      
      console.log('\n🎉 Mailgun reminder test completed successfully!');
      console.log('📬 Check the inbox at charlenenowak@gmx.de');
      console.log('📧 This email was sent using the same Mailgun infrastructure as other Kraatz Club notifications');
    } else {
      console.error('❌ Failed to send email via Mailgun:', result);
      throw new Error(`Mailgun API error: ${response.status} - ${result.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error sending reminder via Mailgun:', error);
    
    if (error.message.includes('Unauthorized')) {
      console.log('\n🔐 Authentication failed. Check your MAILGUN_API_KEY');
    } else if (error.message.includes('domain')) {
      console.log('\n🌐 Domain issue. Verify kraatz-group.de domain is configured in Mailgun');
    }
    
    throw error;
  }
}

// Check dependencies
try {
  require.resolve('form-data');
  require.resolve('node-fetch');
} catch (e) {
  console.log('❌ Missing dependencies');
  console.log('📦 Install with: npm install form-data node-fetch');
  process.exit(1);
}

// Run the test
sendReminderViaMailgun()
  .then(() => {
    console.log('\n✅ Mailgun reminder test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Mailgun reminder test failed:', error.message);
    process.exit(1);
  });
