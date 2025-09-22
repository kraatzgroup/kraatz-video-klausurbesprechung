const FormData = require('form-data');
const fetch = require('node-fetch');

async function sendTestEmails() {
  const testEmail = 'charlenenowak@gmx.de';
  const mailgunDomain = 'mg.kraatz-club.de';
  const mailgunApiKey = process.env.MAILGUN_API_KEY || 'your-mailgun-api-key-here';
  
  if (!mailgunApiKey || mailgunApiKey === 'your-mailgun-api-key-here') {
    console.log('❌ MAILGUN_API_KEY environment variable not set');
    console.log('💡 Please set your Mailgun API key as an environment variable');
    return;
  }

  console.log(`📧 Sending test emails directly to: ${testEmail}`);
  console.log(`🔗 Using Mailgun domain: ${mailgunDomain}`);

  const testScenarios = [
    {
      name: 'Scenario 1: New Case Study Available',
      subject: '[Kraatz-Club] Sachverhalt verfügbar',
      title: '📚 Sachverhalt verfügbar',
      message: 'Ihr Sachverhalt für Zivilrecht - Vertragsrecht ist jetzt verfügbar und kann bearbeitet werden.',
      actionText: 'Sie können jetzt mit der Bearbeitung beginnen.',
      buttonText: 'Sachverhalt ansehen',
      buttonColor: '#28a745'
    },
    {
      name: 'Scenario 2: Correction Available',
      subject: '[Kraatz-Club] Korrektur verfügbar',
      title: '🎓 Korrektur verfügbar',
      message: 'Die Korrektur für Zivilrecht - Vertragsrecht ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.',
      actionText: 'Ihre Korrektur ist jetzt verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.',
      buttonText: 'Korrektur ansehen',
      buttonColor: '#007bff'
    },
    {
      name: 'Scenario 3: Submission Confirmed',
      subject: '[Kraatz-Club] Bearbeitung eingereicht',
      title: '✅ Bearbeitung eingereicht',
      message: 'Ihre Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.',
      actionText: 'Ihre Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.',
      buttonText: 'Zum Dashboard',
      buttonColor: '#6c757d'
    },
    {
      name: 'Scenario 4: Case Study Completed',
      subject: '[Kraatz-Club] Klausur abgeschlossen',
      title: '🎉 Klausur abgeschlossen',
      message: 'Ihre Klausur für Zivilrecht - Vertragsrecht wurde erfolgreich abgeschlossen. Herzlichen Glückwunsch!',
      actionText: 'Herzlichen Glückwunsch! Ihre Klausur wurde erfolgreich abgeschlossen.',
      buttonText: 'Zum Dashboard',
      buttonColor: '#28a745'
    },
    {
      name: 'Scenario 5: Correction in Progress',
      subject: '[Kraatz-Club] Korrektur in Bearbeitung',
      title: '👨‍🏫 Korrektur in Bearbeitung',
      message: 'Ihr Dozent bearbeitet gerade Ihre Klausur. Die Korrektur wird bald verfügbar sein.',
      actionText: 'Ihr Dozent bearbeitet gerade Ihre Klausur. Die Korrektur wird bald verfügbar sein.',
      buttonText: 'Zum Dashboard',
      buttonColor: '#007bff'
    },
    {
      name: 'Scenario 6: Additional Materials Available',
      subject: '[Kraatz-Club] Zusätzliche Materialien verfügbar',
      title: '📄 Zusätzliche Materialien verfügbar',
      message: 'Für Ihre Klausur stehen zusätzliche Materialien und Musterlösungen zur Verfügung.',
      actionText: 'Zusätzliche Materialien und Musterlösungen sind jetzt verfügbar.',
      buttonText: 'Materialien ansehen',
      buttonColor: '#17a2b8'
    }
  ];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🧪 ${scenario.name}...`);
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${scenario.title}</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Liebe/r Charlene Nowak (Test),
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${scenario.message}
          </p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Klausur-Details:</h4>
            <p style="margin: 5px 0; color: #555;"><strong>Rechtsgebiet:</strong> Zivilrecht</p>
            <p style="margin: 5px 0; color: #555;"><strong>Teilbereich:</strong> Vertragsrecht</p>
            <p style="margin: 5px 0; color: #555;"><strong>Dozent:</strong> Prof. Kraatz</p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${scenario.actionText}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <a href="https://kraatz-club.netlify.app/dashboard" 
               style="display: inline-block; background-color: ${scenario.buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              ${scenario.buttonText}
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;">
          <p>Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
          <p>Bei Fragen wenden Sie sich bitte an Ihren Dozenten oder das Support-Team.</p>
        </div>
      </div>
    `;

    try {
      const formData = new FormData();
      formData.append('from', 'Kraatz-Club <noreply@kraatz-club.de>');
      formData.append('to', testEmail);
      formData.append('subject', scenario.subject);
      formData.append('html', emailContent);

      const response = await fetch(
        `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Email sent successfully - ID: ${result.id}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to send email: ${response.status}`);
        console.log(`📧 Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error sending email: ${error.message}`);
    }
    
    // Wait between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 All test email scenarios completed!');
  console.log(`\n📬 Check the email inbox for: ${testEmail}`);
  console.log('\n📋 Test scenarios sent:');
  testScenarios.forEach((scenario, index) => {
    console.log(`   ${index + 1}. ${scenario.name}`);
  });
}

sendTestEmails().catch(console.error);
