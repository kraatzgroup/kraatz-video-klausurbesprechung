const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function setupVacationCron() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🏖️ Setting up Vacation Checker Cron Job');
    console.log('=' .repeat(50));

    // 1. Enable pg_cron extension
    console.log('\n1. 🔧 Enabling pg_cron extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron;');
      console.log('   ✅ pg_cron extension enabled');
    } catch (error) {
      console.log('   ⚠️ pg_cron extension may already exist or require superuser privileges');
      console.log('   📝 Note: This may need to be enabled by Supabase support');
    }

    // 2. Remove existing vacation checker job
    console.log('\n2. 🧹 Removing existing vacation checker job...');
    try {
      await client.query("SELECT cron.unschedule('vacation-checker-daily');");
      console.log('   ✅ Existing job removed');
    } catch (error) {
      console.log('   ℹ️ No existing job to remove');
    }

    // 3. Create vacation checker logs table
    console.log('\n3. 📋 Creating vacation checker logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacation_checker_logs (
        id SERIAL PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL,
        users_on_vacation INTEGER DEFAULT 0,
        users_returned INTEGER DEFAULT 0,
        actions_performed INTEGER DEFAULT 0,
        errors TEXT,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ vacation_checker_logs table created');

    // 4. Create index for logs
    console.log('\n4. 🔍 Creating log table index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vacation_logs_date 
      ON vacation_checker_logs (executed_at DESC);
    `);
    console.log('   ✅ Log table index created');

    // 5. Set up RLS policies
    console.log('\n5. 🔒 Setting up Row Level Security...');
    await client.query('ALTER TABLE vacation_checker_logs ENABLE ROW LEVEL SECURITY;');
    
    // Policy for service role to insert
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Service role can insert vacation logs" 
      ON vacation_checker_logs 
      FOR INSERT 
      TO service_role 
      WITH CHECK (true);
    `);
    
    // Policy for admins to read
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Admins can read vacation logs" 
      ON vacation_checker_logs 
      FOR SELECT 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
    `);
    console.log('   ✅ RLS policies created');

    // 6. Schedule the cron job
    console.log('\n6. ⏰ Scheduling vacation checker cron job...');
    const cronQuery = `
      SELECT cron.schedule(
        'vacation-checker-daily',
        '0 2 * * *',
        $$
        SELECT
          net.http_post(
            url := 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/vacation-checker',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
            ),
            body := jsonb_build_object(
              'source', 'cron_job',
              'timestamp', now()
            )
          ) as result;
        $$
      );
    `;

    try {
      await client.query(cronQuery);
      console.log('   ✅ Cron job scheduled successfully');
      console.log('   📅 Schedule: Daily at 02:00 AM (0 2 * * *)');
    } catch (error) {
      console.log('   ⚠️ Cron job scheduling failed - may require pg_cron extension');
      console.log('   📝 Error:', error.message);
      console.log('   💡 You may need to run this manually in Supabase SQL Editor');
    }

    // 7. Show current cron jobs
    console.log('\n7. 📋 Current cron jobs:');
    try {
      const { rows: jobs } = await client.query(`
        SELECT 
          jobname,
          schedule,
          active,
          command
        FROM cron.job 
        WHERE jobname LIKE '%vacation%'
        ORDER BY jobname;
      `);

      if (jobs.length > 0) {
        jobs.forEach(job => {
          console.log(`   📌 ${job.jobname}:`);
          console.log(`      Schedule: ${job.schedule}`);
          console.log(`      Active: ${job.active}`);
          console.log(`      Command: ${job.command.substring(0, 100)}...`);
        });
      } else {
        console.log('   ℹ️ No vacation-related cron jobs found');
      }
    } catch (error) {
      console.log('   ⚠️ Could not fetch cron jobs - pg_cron may not be available');
    }

    console.log('\n✅ Vacation Cron Job setup completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database tables and indexes created');
    console.log('   ✅ Row Level Security policies configured');
    console.log('   ✅ Cron job scheduled (if pg_cron is available)');
    console.log('   ✅ Logging system ready');
    
    console.log('\n🔧 Manual Setup (if needed):');
    console.log('   1. Enable pg_cron in Supabase (may require support ticket)');
    console.log('   2. Deploy vacation-checker edge function');
    console.log('   3. Test function manually first');
    console.log('   4. Monitor vacation_checker_logs table');

  } catch (error) {
    console.error('❌ Error setting up vacation cron:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupVacationCron()
  .then(() => {
    console.log('🎉 Vacation cron setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
