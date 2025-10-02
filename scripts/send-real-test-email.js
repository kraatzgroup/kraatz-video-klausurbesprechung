const nodemailer = require('nodemailer');

// E-Mail-Konfiguration
const EMAIL_CONFIG = {
  // Option 1: Gmail (einfachste Option für Tests)
  gmail: {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // z.B. 'your-email@gmail.com'
      pass: process.env.GMAIL_APP_PASSWORD // App-spezifisches Passwort
    }
  },
  
  // Option 2: SMTP (für andere Provider)
  smtp: {
    host: process.env.SMTP_HOST, // z.B. 'smtp.gmx.net'
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  }
};

async function sendRealTestEmail() {
  try {
    console.log('📧 Preparing to send real test email...');
    
    // Check for environment variables
    const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
    
    if (!hasGmail && !hasSmtp) {
      console.log('\n❌ No email configuration found!');
      console.log('\n📋 To send real emails, set up one of these options:');
      console.log('\n🔧 Option 1: Gmail (recommended for testing)');
      console.log('   export GMAIL_USER="your-email@gmail.com"');
      console.log('   export GMAIL_APP_PASSWORD="your-app-password"');
      console.log('\n🔧 Option 2: SMTP (for other providers)');
      console.log('   export SMTP_HOST="smtp.gmx.net"');
      console.log('   export SMTP_USER="your-email@gmx.de"');
      console.log('   export SMTP_PASSWORD="your-password"');
      console.log('\n💡 For Gmail: Enable 2FA and create an App Password');
      console.log('   https://support.google.com/accounts/answer/185833');
      return;
    }

    // Choose configuration
    const config = hasGmail ? EMAIL_CONFIG.gmail : EMAIL_CONFIG.smtp;
    const configType = hasGmail ? 'Gmail' : 'SMTP';
    
    console.log(`🔧 Using ${configType} configuration`);

    // Create transporter
    const transporter = nodemailer.createTransporter(config);

    // Verify connection
    console.log('🔍 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified');

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
              Gesendet am: ${new Date().toLocaleString('de-DE')}
            </p>
          </div>
          
          <p>Hallo ${testData.user.first_name},</p>
          
          <p>das E-Mail-Erinnerungssystem funktioniert! 🎉</p>
          
          <p>Hier ist ein Beispiel, wie deine Wiederholungserinnerungen aussehen werden:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">📚 Klausur-Details:</h3>
            <p><strong>Rechtsgebiet:</strong> ${testData.caseStudy.legal_area}</p>
            <p><strong>Teilgebiet:</strong> ${testData.caseStudy.sub_area}</p>
            <p><strong>Schwerpunkt:</strong> ${testData.caseStudy.focus_area}</p>
            <p><strong>Klausur #:</strong> ${testData.caseStudy.case_study_number}</p>
          </div>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h4 style="margin-top: 0; color: #DC2626;">💡 Beispiel - Deine Erkenntnisse:</h4>
            <p style="font-style: italic;">"${testData.feedback.mistakes_learned}"</p>
          </div>
          
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E;">
            <h4 style="margin-top: 0; color: #16A34A;">🎯 Beispiel - Deine Verbesserungsziele:</h4>
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
              Das automatische Erinnerungssystem ist bereit für den Einsatz.
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Wenn du in Zukunft bei deinen Feedbacks die E-Mail-Erinnerung aktivierst, 
            erhältst du automatisch solche personalisierten Erinnerungen an deinem Wiederholungstermin.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Diese Test-E-Mail wurde vom Kraatz Club Erinnerungssystem gesendet.<br>
            Bei Fragen wende dich an das Support-Team.
          </p>
        </div>
      </div>
    `;

    // Send email
    console.log(`📤 Sending test email to: ${testData.user.email}`);
    
    const mailOptions = {
      from: `"Kraatz Club" <${hasGmail ? process.env.GMAIL_USER : process.env.SMTP_USER}>`,
      to: testData.user.email,
      subject: emailSubject,
      html: emailHtml
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📤 Sent to: ${testData.user.email}`);
    console.log(`📋 Subject: ${emailSubject}`);
    
    console.log('\n🎉 Real email test completed successfully!');
    console.log('📬 Check the inbox at charlenenowak@gmx.de');

  } catch (error) {
    console.error('❌ Error sending real test email:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication failed. Check your credentials:');
      console.log('- Gmail: Make sure you use an App Password, not your regular password');
      console.log('- SMTP: Verify your username and password are correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🌐 SMTP server not found. Check your SMTP_HOST setting');
    } else {
      console.log('\n💡 Common solutions:');
      console.log('- Check your internet connection');
      console.log('- Verify email provider settings');
      console.log('- Make sure 2FA is enabled for Gmail');
    }
    
    throw error;
  }
}

// Check if nodemailer is installed
try {
  require.resolve('nodemailer');
} catch (e) {
  console.log('❌ nodemailer is not installed');
  console.log('📦 Install it with: npm install nodemailer');
  console.log('🔧 Or run: npm install');
  process.exit(1);
}

// Run the test
sendRealTestEmail()
  .then(() => {
    console.log('\n✅ Real email test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Real email test failed:', error.message);
    process.exit(1);
  });
