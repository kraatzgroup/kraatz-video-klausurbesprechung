#!/usr/bin/env node

/**
 * Test-Script für Admin-Benachrichtigungen
 * Überprüft, ob Admins Benachrichtigungen über die Glocke erhalten
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testAdminNotifications() {
  console.log('🔔 Testing Admin Notification System...\n');

  try {
    // 1. Find admin users
    console.log('👑 Finding admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
    adminUsers?.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.first_name} ${admin.last_name} (${admin.email})`);
    });
    console.log('');

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admin users found. Creating test notification for first available user...');
      
      // Get any user for testing
      const { data: anyUser } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .limit(1);
      
      if (anyUser && anyUser.length > 0) {
        adminUsers.push(anyUser[0]);
        console.log(`📝 Using test user: ${anyUser[0].first_name} ${anyUser[0].last_name} (${anyUser[0].email})`);
      }
    }

    // 2. Check existing notifications for admins
    console.log('📥 Checking existing notifications for admin users...');
    for (const admin of adminUsers || []) {
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, title, message, type, read, created_at')
        .eq('user_id', admin.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifError) {
        console.error(`❌ Error fetching notifications for ${admin.email}:`, notifError);
        continue;
      }

      console.log(`\n👤 ${admin.first_name} ${admin.last_name} (${admin.email}):`);
      console.log(`   📊 Total recent notifications: ${notifications?.length || 0}`);
      
      if (notifications && notifications.length > 0) {
        const unreadCount = notifications.filter(n => !n.read).length;
        console.log(`   🔔 Unread notifications: ${unreadCount}`);
        console.log('   📋 Recent notifications:');
        
        notifications.slice(0, 3).forEach((notif, index) => {
          const readStatus = notif.read ? '✅' : '🔔';
          const timeAgo = getTimeAgo(notif.created_at);
          console.log(`      ${index + 1}. ${readStatus} ${notif.title}`);
          console.log(`         "${notif.message.substring(0, 60)}${notif.message.length > 60 ? '...' : ''}"`);
          console.log(`         ${timeAgo}`);
        });
      } else {
        console.log('   📭 No recent notifications found');
      }
    }

    // 3. Test notification creation for admin
    if (adminUsers && adminUsers.length > 0) {
      const testAdmin = adminUsers[0];
      console.log(`\n🧪 Creating test notification for admin: ${testAdmin.email}`);
      
      const testNotification = {
        user_id: testAdmin.id,
        title: '🧪 Test Admin Notification',
        message: `Test notification created at ${new Date().toLocaleString('de-DE')} to verify admin notification system`,
        type: 'info',
        read: false
      };

      const { data: newNotification, error: createError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test notification:', createError);
      } else {
        console.log('✅ Test notification created successfully:');
        console.log(`   ID: ${newNotification.id}`);
        console.log(`   Title: ${newNotification.title}`);
        console.log(`   Message: ${newNotification.message}`);
        
        // Verify it appears in the admin's notifications
        console.log('\n🔍 Verifying notification appears for admin...');
        const { data: verification } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', testAdmin.id)
          .eq('id', newNotification.id)
          .single();
        
        if (verification) {
          console.log('✅ Verification successful - notification exists in admin\'s feed');
        } else {
          console.log('❌ Verification failed - notification not found');
        }
      }
    }

    // 4. Check chat conversations involving admins
    console.log('\n💬 Checking chat conversations involving admin users...');
    for (const admin of adminUsers || []) {
      const { data: conversations, error: convError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations(title, created_at),
          users(first_name, last_name, email)
        `)
        .eq('user_id', admin.id);

      if (convError) {
        console.error(`❌ Error fetching conversations for ${admin.email}:`, convError);
        continue;
      }

      console.log(`\n👤 ${admin.first_name} ${admin.last_name} conversations:`);
      if (conversations && conversations.length > 0) {
        console.log(`   💬 Active in ${conversations.length} conversation(s):`);
        conversations.forEach((conv, index) => {
          const title = conv.conversations?.title || 'Untitled';
          const created = conv.conversations?.created_at;
          const timeAgo = created ? getTimeAgo(created) : 'Unknown time';
          console.log(`      ${index + 1}. "${title}" (created ${timeAgo})`);
        });
      } else {
        console.log('   📭 Not participating in any conversations');
      }
    }

    // 5. Test real-time subscription setup
    console.log('\n📡 Testing real-time notification subscription for admins...');
    console.log('ℹ️ Note: Real-time testing requires browser environment');
    console.log('ℹ️ In the browser, the NotificationDropdown component should:');
    console.log('   1. ✅ Be visible for all users (including admins)');
    console.log('   2. ✅ Subscribe to notifications for the current user');
    console.log('   3. ✅ Show unread count badge');
    console.log('   4. ✅ Update in real-time when new notifications arrive');

    console.log('\n🔧 Recommendations for admin notification issues:');
    console.log('');
    console.log('1. **Check Browser Console**: Look for notification subscription logs');
    console.log('   - Should see: "Setting up notification subscription for user: [admin-id]"');
    console.log('   - Should see: "Successfully subscribed to notifications"');
    console.log('');
    console.log('2. **Verify Database Permissions**: Ensure admin users can:');
    console.log('   - Read from notifications table');
    console.log('   - Receive real-time updates');
    console.log('');
    console.log('3. **Test Chat Notifications**: Send a message in a conversation with admin');
    console.log('   - Admin should receive notification instantly');
    console.log('   - Bell icon should show red badge');
    console.log('');
    console.log('4. **Check Supabase Real-time**: Ensure real-time is enabled in project settings');
    console.log('   - Go to Supabase Dashboard > Settings > API');
    console.log('   - Verify "Realtime" is enabled');

  } catch (error) {
    console.error('❌ Error during admin notification test:', error);
  } finally {
    console.log('\n🔌 Database connection closed');
  }
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'vor wenigen Minuten';
  } else if (diffInHours < 24) {
    return `vor ${Math.floor(diffInHours)} Std.`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  }
}

// Run the test
testAdminNotifications()
  .then(() => {
    console.log('\n🎉 Admin notification test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
