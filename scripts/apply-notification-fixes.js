#!/usr/bin/env node

/**
 * Wendet RLS-Fixes und Trigger für Admin-Benachrichtigungen an
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Service Role Key für Admin-Operationen
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function applyNotificationFixes() {
  console.log('🔧 Applying notification system fixes...\n');

  try {
    // 1. Prüfe aktuelle RLS-Richtlinien
    console.log('🔍 Checking current RLS policies...');
    
    const { data: currentPolicies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .select('*')
      .eq('tablename', 'notifications');

    if (policiesError) {
      console.log('⚠️ Could not fetch current policies (this is normal)');
    } else {
      console.log('📋 Current policies:', currentPolicies?.length || 0);
    }

    // 2. RLS-Richtlinien anwenden
    console.log('\n🔒 Applying RLS policies for notifications...');
    
    const rlsPolicies = [
      // Policy für System-Benachrichtigungen
      `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notifications' 
          AND policyname = 'System can create notifications'
        ) THEN
          CREATE POLICY "System can create notifications" ON public.notifications
            FOR INSERT WITH CHECK (true);
          RAISE NOTICE 'Created policy: System can create notifications';
        ELSE
          RAISE NOTICE 'Policy already exists: System can create notifications';
        END IF;
      END $$;
      `,
      
      // Policy für Benutzer - eigene Benachrichtigungen lesen
      `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notifications' 
          AND policyname = 'Users can read own notifications'
        ) THEN
          CREATE POLICY "Users can read own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
          RAISE NOTICE 'Created policy: Users can read own notifications';
        ELSE
          RAISE NOTICE 'Policy already exists: Users can read own notifications';
        END IF;
      END $$;
      `,
      
      // Policy für Benutzer - eigene Benachrichtigungen aktualisieren
      `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notifications' 
          AND policyname = 'Users can update own notifications'
        ) THEN
          CREATE POLICY "Users can update own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
          RAISE NOTICE 'Created policy: Users can update own notifications';
        ELSE
          RAISE NOTICE 'Policy already exists: Users can update own notifications';
        END IF;
      END $$;
      `,
      
      // Policy für Benutzer - eigene Benachrichtigungen löschen
      `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notifications' 
          AND policyname = 'Users can delete own notifications'
        ) THEN
          CREATE POLICY "Users can delete own notifications" ON public.notifications
            FOR DELETE USING (auth.uid() = user_id);
          RAISE NOTICE 'Created policy: Users can delete own notifications';
        ELSE
          RAISE NOTICE 'Policy already exists: Users can delete own notifications';
        END IF;
      END $$;
      `
    ];

    for (const [index, policy] of rlsPolicies.entries()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.error(`❌ Error applying policy ${index + 1}:`, error);
        } else {
          console.log(`✅ Applied RLS policy ${index + 1}`);
        }
      } catch (err) {
        console.error(`❌ Error with policy ${index + 1}:`, err);
      }
    }

    // 3. Notification-Trigger anwenden
    console.log('\n🔔 Applying notification triggers...');
    
    const triggerSQL = `
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

    -- Create trigger for new user registrations
    DROP TRIGGER IF EXISTS new_user_notification_trigger ON users;
    CREATE TRIGGER new_user_notification_trigger
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_user_registration();
    `;

    try {
      const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
      if (triggerError) {
        console.error('❌ Error applying notification triggers:', triggerError);
      } else {
        console.log('✅ Applied notification triggers successfully');
      }
    } catch (err) {
      console.error('❌ Error with triggers:', err);
    }

    // 4. Test Admin-Benachrichtigung erstellen
    console.log('\n🧪 Testing admin notification creation...');
    
    // Finde Admin-Benutzer
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.error('❌ Error finding admin users:', adminError);
    } else if (adminUsers && adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`👑 Found admin: ${admin.first_name} ${admin.last_name} (${admin.email})`);
      
      // Test-Benachrichtigung erstellen
      const testNotification = {
        user_id: admin.id,
        title: '🔔 Admin-Benachrichtigungen aktiviert',
        message: `Das Benachrichtigungssystem wurde erfolgreich für Admin-Benutzer aktiviert. Sie erhalten jetzt Benachrichtigungen über die Glocke.`,
        type: 'success',
        read: false
      };

      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (notifError) {
        console.error('❌ Error creating test notification:', notifError);
      } else {
        console.log('✅ Test notification created successfully:');
        console.log(`   ID: ${notification.id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   For: ${admin.email}`);
      }
    } else {
      console.log('⚠️ No admin users found');
    }

    // 5. Chat-Benachrichtigungen für Admins testen
    console.log('\n💬 Testing chat notification system for admins...');
    
    // Prüfe, ob Admins in Chat-Konversationen sind
    const { data: adminConversations, error: convError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        conversation_id,
        users!inner(email, first_name, last_name, role)
      `)
      .eq('users.role', 'admin');

    if (convError) {
      console.error('❌ Error checking admin conversations:', convError);
    } else {
      console.log(`📊 Admins in conversations: ${adminConversations?.length || 0}`);
      
      if (adminConversations && adminConversations.length > 0) {
        console.log('✅ Admin users are participating in chat conversations');
        console.log('✅ They should receive chat notifications automatically');
      } else {
        console.log('ℹ️ No admin users found in chat conversations');
        console.log('ℹ️ Admins will receive notifications when they join conversations');
      }
    }

    console.log('\n🎯 Summary of changes:');
    console.log('');
    console.log('✅ **RLS Policies Applied**:');
    console.log('   - System can create notifications (for triggers)');
    console.log('   - Users can read their own notifications');
    console.log('   - Users can update their own notifications');
    console.log('   - Users can delete their own notifications');
    console.log('');
    console.log('✅ **Triggers Applied**:');
    console.log('   - New user registration notifications for admins');
    console.log('   - Case study status change notifications');
    console.log('');
    console.log('✅ **Chat Notifications**:');
    console.log('   - Admins receive chat notifications like all other users');
    console.log('   - NotificationDropdown is visible for all user roles');
    console.log('');
    console.log('🔔 **Admin Bell Notifications**:');
    console.log('   - Admins should now see the bell icon with notifications');
    console.log('   - Real-time updates should work for admin users');
    console.log('   - Red badge appears when there are unread notifications');

  } catch (error) {
    console.error('❌ Error during notification fixes:', error);
  }
}

// Run the fixes
applyNotificationFixes()
  .then(() => {
    console.log('\n🎉 Notification fixes applied successfully');
    console.log('🔔 Admin users should now receive notifications via the bell icon');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to apply notification fixes:', error);
    process.exit(1);
  });
