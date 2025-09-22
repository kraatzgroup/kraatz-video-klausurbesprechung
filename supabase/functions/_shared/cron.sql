-- 🏖️ VACATION CHECKER CRON JOB SETUP
-- This SQL script sets up a daily cron job to check vacation status

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing vacation checker job if it exists
SELECT cron.unschedule('vacation-checker-daily');

-- Schedule the vacation checker to run daily at 02:00 AM
SELECT cron.schedule(
    'vacation-checker-daily',           -- Job name
    '0 2 * * *',                      -- Cron expression: daily at 02:00 AM
    $$
    -- Call the vacation-checker edge function
    SELECT
      net.http_post(
        url := 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/vacation-checker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'source', 'cron_job',
          'timestamp', now()
        )
      ) as result;
    $$
);

-- Create a log table for vacation checker results (optional)
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

-- Create an index for efficient log queries
CREATE INDEX IF NOT EXISTS idx_vacation_logs_date 
ON vacation_checker_logs (executed_at DESC);

-- Grant permissions for the vacation checker logs
ALTER TABLE vacation_checker_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to insert logs
CREATE POLICY IF NOT EXISTS "Service role can insert vacation logs" 
ON vacation_checker_logs 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Policy to allow admins to read logs
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

-- Show current cron jobs
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname LIKE '%vacation%';

/*
🏖️ VACATION CHECKER CRON JOB

SCHEDULE: Daily at 02:00 AM (0 2 * * *)

WHAT IT DOES:
1. ✅ Calls the vacation-checker edge function
2. ✅ Checks all users for vacation status
3. ✅ Automatically manages email notifications
4. ✅ Cleans up expired vacation data
5. ✅ Logs results for monitoring

MONITORING:
- Check vacation_checker_logs table for execution history
- Monitor edge function logs in Supabase dashboard
- Verify cron job status with: SELECT * FROM cron.job;

MANUAL EXECUTION:
To test the function manually:
curl -X POST https://rpgbyockvpannrupicno.supabase.co/functions/v1/vacation-checker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual_test"}'
*/
