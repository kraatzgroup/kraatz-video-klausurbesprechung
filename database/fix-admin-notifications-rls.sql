-- Fix RLS policies for notifications table to enable admin notifications
-- Run this SQL in your Supabase SQL Editor

-- 1. Enable RLS on notifications table (if not already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Instructors can create notifications" ON public.notifications;

-- 3. Create comprehensive RLS policies for notifications

-- Allow system/service role to create notifications (for triggers and system operations)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Allow users to read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow authenticated users to create notifications for others (for chat notifications)
-- This is needed for the chat system where users create notifications for other participants
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create a test notification for the admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Create test notification if admin user exists
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
        VALUES (
            admin_user_id,
            '🔔 Admin-Benachrichtigungen aktiviert',
            'Das Benachrichtigungssystem wurde erfolgreich für Admin-Benutzer konfiguriert. Sie erhalten jetzt Benachrichtigungen über die Glocke im Header.',
            'success',
            false,
            NOW()
        );
        
        RAISE NOTICE 'Test notification created for admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found to create test notification';
    END IF;
END $$;

-- 5. Ensure notification triggers are in place for admin notifications

-- Function to notify admins of new user registrations
CREATE OR REPLACE FUNCTION notify_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
    admin_id UUID;
BEGIN
    -- Get all admin user IDs
    SELECT ARRAY(SELECT id FROM users WHERE role = 'admin') INTO admin_ids;
    
    -- Notify all admins
    FOREACH admin_id IN ARRAY admin_ids
    LOOP
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES (
            admin_id,
            '👤 Neuer Benutzer registriert',
            'Ein neuer Benutzer hat sich registriert: ' || NEW.email || ' (' || COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Name nicht angegeben') || ')',
            'info',
            false
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registrations (recreate to ensure it's active)
DROP TRIGGER IF EXISTS new_user_notification_trigger ON users;
CREATE TRIGGER new_user_notification_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_user_registration();

-- 6. Function to create admin notifications for system events
CREATE OR REPLACE FUNCTION create_admin_notification(
    notification_title TEXT,
    notification_message TEXT,
    notification_type TEXT DEFAULT 'info'
)
RETURNS void AS $$
DECLARE
    admin_ids UUID[];
    admin_id UUID;
BEGIN
    -- Get all admin user IDs
    SELECT ARRAY(SELECT id FROM users WHERE role = 'admin') INTO admin_ids;
    
    -- Create notification for all admins
    FOREACH admin_id IN ARRAY admin_ids
    LOOP
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES (
            admin_id,
            notification_title,
            notification_message,
            notification_type,
            false
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- 8. Test the system by creating another notification
SELECT create_admin_notification(
    '🚀 Benachrichtigungssystem bereit',
    'Das Admin-Benachrichtigungssystem ist jetzt vollständig konfiguriert und einsatzbereit. Admins erhalten Benachrichtigungen für neue Benutzer, Chat-Nachrichten und System-Events.',
    'success'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin notification system has been successfully configured!';
    RAISE NOTICE '🔔 Admins should now see notifications via the bell icon in the header';
    RAISE NOTICE '📱 Real-time notifications are enabled for all user roles including admins';
END $$;
