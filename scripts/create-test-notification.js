// Simple test to create a notification directly in the database
// This can be run in the browser console to test if notifications work

async function createTestNotification() {
  try {
    // Get supabase from the global window object (when app is loaded)
    const supabase = window.supabase;
    if (!supabase) {
      console.error('❌ Supabase not found. Make sure you are on the app page.');
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('🧪 Creating test notification for user:', user.id);

    // Create a test notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: '💬 Test Chat-Nachricht',
        message: 'Test User: Dies ist eine Test-Nachricht für die Glocke - ' + new Date().toLocaleTimeString(),
        type: 'info',
        related_case_study_id: 'test-conversation-123',
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test notification:', error);
      return;
    }

    console.log('✅ Test notification created successfully:', data);
    console.log('🔔 Check the bell icon - it should show a red badge!');
    
    // Also fetch all notifications to verify
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('📋 Recent notifications:', allNotifications);
    
    return data;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make function available globally
window.createTestNotification = createTestNotification;

console.log('🧪 Test function loaded. Run createTestNotification() to test notifications.');
