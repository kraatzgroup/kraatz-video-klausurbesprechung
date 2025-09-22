const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function setupEmailNotifications() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create webhook functions for email notifications
    const createWebhookFunctions = `
      -- Create function to call notify-dozent edge function
      CREATE OR REPLACE FUNCTION notify_dozent_webhook()
      RETURNS trigger AS $$
      BEGIN
        -- Call the edge function via HTTP request
        PERFORM
          net.http_post(
            url := 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/notify-dozent',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
              'type', TG_OP,
              'record', row_to_json(NEW)
            )
          );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create function to call notify-student edge function
      CREATE OR REPLACE FUNCTION notify_student_webhook()
      RETURNS trigger AS $$
      BEGIN
        -- Call the edge function via HTTP request
        PERFORM
          net.http_post(
            url := 'https://rpgbyockvpannrupicno.supabase.co/functions/v1/notify-student',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
              'type', TG_OP,
              'record', row_to_json(NEW)
            )
          );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await client.query(createWebhookFunctions);
    console.log('✅ Created webhook functions');

    // Create triggers
    const createTriggers = `
      -- Drop existing triggers if they exist
      DROP TRIGGER IF EXISTS notify_dozent_on_notification_insert ON notifications;
      DROP TRIGGER IF EXISTS notify_student_on_notification_insert ON notifications;

      -- Create trigger for instructor notifications
      CREATE TRIGGER notify_dozent_on_notification_insert
        AFTER INSERT ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION notify_dozent_webhook();

      -- Create trigger for student notifications  
      CREATE TRIGGER notify_student_on_notification_insert
        AFTER INSERT ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION notify_student_webhook();
    `;

    await client.query(createTriggers);
    console.log('✅ Created database triggers');

    // Enable the http extension if not already enabled
    const enableHttpExtension = `
      CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
    `;

    await client.query(enableHttpExtension);
    console.log('✅ Enabled HTTP extension');

    console.log('\n🎉 Email notification system setup completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy the Edge Functions to Supabase');
    console.log('2. Set the MAILGUN_API_KEY secret in Supabase');
    console.log('3. Configure the Mailgun domain in the Edge Functions');
    console.log('4. Test the system by creating notifications');

  } catch (error) {
    console.error('❌ Error setting up email notifications:', error);
  } finally {
    await client.end();
  }
}

setupEmailNotifications();
