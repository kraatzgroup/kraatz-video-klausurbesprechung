// Test notification creation specifically for charlene@swipeup-marketing.com
// Run this in browser console when logged in

async function testSpecificNotification() {
  try {
    console.log('🧪 Testing notification for charlene@swipeup-marketing.com...');
    
    const supabase = window.supabase;
    if (!supabase) {
      console.error('❌ Supabase not available');
      return;
    }

    // 1. Find the specific user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'charlene@swipeup-marketing.com')
      .single();

    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('✅ Found user:', user);

    // 2. Create a test notification
    const testNotification = {
      user_id: user.id,
      title: '💬 Test Chat-Nachricht',
      message: 'Charlene Nowak: Test-Nachricht um ' + new Date().toLocaleTimeString() + ' - Funktioniert die Glocke?',
      type: 'info',
      related_case_study_id: 'test-conversation-' + Date.now(),
      read: false
    };

    console.log('🔔 Creating notification:', testNotification);

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      return;
    }

    console.log('✅ Notification created:', notification);

    // 3. Verify it exists
    const { data: verification } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📋 Recent notifications for user:', verification);

    // 4. Check unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    console.log('🔔 Unread notifications count:', count);

    console.log('🎯 If logged in as charlene@swipeup-marketing.com, check the bell icon now!');

    return {
      user,
      notification,
      verification,
      unreadCount: count
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make function available globally
window.testSpecificNotification = testSpecificNotification;

console.log('🧪 Specific test function loaded. Run testSpecificNotification() to test.');
