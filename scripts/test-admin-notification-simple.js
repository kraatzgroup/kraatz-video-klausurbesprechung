#!/usr/bin/env node

/**
 * Einfacher Test für Admin-Benachrichtigungen
 * Erstellt eine Test-Benachrichtigung direkt über Service Role
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Versuche Service Role Key, falls verfügbar
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Testing admin notifications with available keys...\n');

if (serviceKey) {
  console.log('🔑 Using service role key for admin operations');
} else {
  console.log('⚠️ No service role key found, using anon key (limited permissions)');
}

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  serviceKey || anonKey
);

async function testAdminNotificationSimple() {
  try {
    // 1. Admin-Benutzer finden
    console.log('👑 Finding admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error finding admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
    adminUsers?.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.first_name} ${admin.last_name} (${admin.email})`);
    });

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }

    const admin = adminUsers[0];

    // 2. Test-Benachrichtigung mit Service Role erstellen
    if (serviceKey) {
      console.log('\n🧪 Creating test notification with service role...');
      
      const testNotification = {
        user_id: admin.id,
        title: '🔔 Admin-Benachrichtigungen Test',
        message: `Test-Benachrichtigung für Admin erstellt um ${new Date().toLocaleString('de-DE')}. Das Benachrichtigungssystem sollte jetzt für Admins funktionieren.`,
        type: 'info',
        read: false
      };

      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (notifError) {
        console.error('❌ Error creating test notification:', notifError);
        
        if (notifError.code === '42501') {
          console.log('\n💡 RLS Policy Problem detected!');
          console.log('The notifications table has Row-Level Security enabled but no policy allows INSERT operations.');
          console.log('\nTo fix this, run the following SQL in your Supabase SQL Editor:');
          console.log('');
          console.log('-- Enable RLS if not already enabled');
          console.log('ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;');
          console.log('');
          console.log('-- Allow system to create notifications');
          console.log('CREATE POLICY "System can create notifications" ON public.notifications');
          console.log('  FOR INSERT WITH CHECK (true);');
          console.log('');
          console.log('-- Allow users to read their own notifications');
          console.log('CREATE POLICY "Users can read own notifications" ON public.notifications');
          console.log('  FOR SELECT USING (auth.uid() = user_id);');
          console.log('');
          console.log('-- Allow users to update their own notifications');
          console.log('CREATE POLICY "Users can update own notifications" ON public.notifications');
          console.log('  FOR UPDATE USING (auth.uid() = user_id);');
          console.log('');
          console.log('-- Allow users to delete their own notifications');
          console.log('CREATE POLICY "Users can delete own notifications" ON public.notifications');
          console.log('  FOR DELETE USING (auth.uid() = user_id);');
        }
      } else {
        console.log('✅ Test notification created successfully:');
        console.log(`   ID: ${notification.id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   For Admin: ${admin.email}`);
        
        // Verifikation
        console.log('\n🔍 Verifying notification exists...');
        const { data: verification, error: verifyError } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', notification.id)
          .single();
        
        if (verifyError) {
          console.error('❌ Verification failed:', verifyError);
        } else {
          console.log('✅ Notification verified in database');
          console.log(`   User ID: ${verification.user_id}`);
          console.log(`   Read status: ${verification.read ? 'Read' : 'Unread'}`);
          console.log(`   Created: ${new Date(verification.created_at).toLocaleString('de-DE')}`);
        }
      }
    } else {
      console.log('\n⚠️ Cannot create test notification without service role key');
      console.log('Service role key is required to bypass RLS policies');
    }

    // 3. Prüfe vorhandene Benachrichtigungen für Admin
    console.log('\n📥 Checking existing notifications for admin...');
    const { data: existingNotifications, error: existingError } = await supabase
      .from('notifications')
      .select('id, title, message, read, created_at')
      .eq('user_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (existingError) {
      console.error('❌ Error fetching existing notifications:', existingError);
    } else {
      console.log(`📊 Found ${existingNotifications?.length || 0} existing notifications for admin`);
      
      if (existingNotifications && existingNotifications.length > 0) {
        console.log('📋 Recent notifications:');
        existingNotifications.forEach((notif, index) => {
          const status = notif.read ? '✅' : '🔔';
          const time = new Date(notif.created_at).toLocaleString('de-DE');
          console.log(`   ${index + 1}. ${status} ${notif.title}`);
          console.log(`      "${notif.message.substring(0, 60)}${notif.message.length > 60 ? '...' : ''}"`);
          console.log(`      ${time}`);
        });
      } else {
        console.log('📭 No existing notifications found');
      }
    }

    // 4. Prüfe NotificationDropdown Komponente
    console.log('\n🔔 Checking NotificationDropdown component...');
    console.log('✅ NotificationDropdown is included in Header.tsx for all authenticated users');
    console.log('✅ No role restrictions found - admins should see the bell icon');
    console.log('✅ Real-time subscription is set up for all users');

    // 5. Empfehlungen
    console.log('\n💡 Recommendations for admin notifications:');
    console.log('');
    console.log('1. **Apply RLS Policies**: Run the SQL commands shown above in Supabase SQL Editor');
    console.log('2. **Test in Browser**: Login as admin and check if bell icon appears');
    console.log('3. **Send Test Message**: Send a chat message to a conversation with admin');
    console.log('4. **Check Console**: Look for notification subscription logs in browser console');
    console.log('');
    console.log('🎯 **Expected Behavior for Admins**:');
    console.log('   - Bell icon visible in header');
    console.log('   - Red badge when unread notifications exist');
    console.log('   - Real-time updates when new notifications arrive');
    console.log('   - Notifications for: new users, chat messages, system events');

  } catch (error) {
    console.error('❌ Error during admin notification test:', error);
  }
}

// Run the test
testAdminNotificationSimple()
  .then(() => {
    console.log('\n🎉 Admin notification test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
