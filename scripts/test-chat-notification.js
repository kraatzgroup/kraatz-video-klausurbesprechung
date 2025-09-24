// Test script to create a chat notification for charlenenowak@gmx.de
// Run this in the browser console when logged in as an admin or another user

async function testChatNotification() {
  console.log('🧪 Testing chat notification creation...');
  
  try {
    // Get the current supabase client from the app
    const supabase = window.supabase || (await import('../src/lib/supabase.js')).supabase;
    
    // Find charlene's user ID
    const { data: charleneUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'charlenenowak@gmx.de')
      .single();
    
    if (userError) {
      console.error('❌ Could not find user:', userError);
      return;
    }
    
    console.log('✅ Found user:', charleneUser);
    
    // Create a test notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: charleneUser.id,
        title: '💬 Test Chat-Nachricht',
        message: 'Test User: Dies ist eine Test-Nachricht für die Glocke',
        type: 'info',
        related_case_study_id: 'test-conversation-id',
        read: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating notification:', error);
      return;
    }
    
    console.log('✅ Test notification created:', data);
    console.log('🔔 Check the bell icon for the notification!');
    
    return data;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in console
window.testChatNotification = testChatNotification;

console.log('📝 Test function loaded. Run testChatNotification() in console to test.');
