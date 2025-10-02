const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runDailyReminderCheck() {
  try {
    console.log('🕐 Starting daily reminder check...');
    console.log('📅 Date:', new Date().toISOString());

    if (!SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-reminder-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'daily-cron-job'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Daily reminder check completed successfully');
      console.log('📊 Results:', result);
      
      if (result.successCount > 0) {
        console.log(`📧 Successfully sent ${result.successCount} reminder emails`);
      }
      
      if (result.errorCount > 0) {
        console.log(`⚠️ ${result.errorCount} emails failed to send`);
      }
      
      if (result.totalProcessed === 0) {
        console.log('📭 No pending reminders found for today');
      }
    } else {
      console.error('❌ Daily reminder check failed:', result);
      throw new Error(`Edge function failed: ${result.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('💥 Error in daily reminder check:', error);
    process.exit(1);
  }
}

// Run the check
runDailyReminderCheck()
  .then(() => {
    console.log('🎉 Daily reminder check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Daily reminder check failed:', error);
    process.exit(1);
  });
