// Debug script for specific users: charlenenowak@gmx.de and charlene@swipeup-marketing.com
// Run this in the browser console when logged in

async function debugSpecificUsers() {
  try {
    console.log('🔍 Debugging chat notifications between specific users...');
    
    const supabase = window.supabase;
    if (!supabase) {
      console.error('❌ Supabase not available');
      return;
    }

    // 1. Find both users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['charlenenowak@gmx.de', 'charlene@swipeup-marketing.com']);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log('👥 Found users:', users);

    const charleneNowak = users.find(u => u.email === 'charlenenowak@gmx.de');
    const charleneSwipeup = users.find(u => u.email === 'charlene@swipeup-marketing.com');

    if (!charleneNowak || !charleneSwipeup) {
      console.error('❌ One or both users not found');
      console.log('Available users:', users.map(u => u.email));
      return;
    }

    console.log('✅ Charlene Nowak:', charleneNowak);
    console.log('✅ Charlene Swipeup:', charleneSwipeup);

    // 2. Check conversations between these users
    const { data: conversations, error: convError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        user_id,
        conversations(*)
      `)
      .in('user_id', [charleneNowak.id, charleneSwipeup.id]);

    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return;
    }

    console.log('💬 All conversation participations:', conversations);

    // Find shared conversations
    const conversationCounts = {};
    conversations?.forEach(cp => {
      conversationCounts[cp.conversation_id] = (conversationCounts[cp.conversation_id] || 0) + 1;
    });

    const sharedConversations = Object.keys(conversationCounts).filter(
      convId => conversationCounts[convId] === 2
    );

    console.log('🤝 Shared conversations:', sharedConversations);

    // 3. Check recent messages in shared conversations
    if (sharedConversations.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', sharedConversations)
        .order('created_at', { ascending: false })
        .limit(10);

      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
      } else {
        console.log('📨 Recent messages:', messages);
      }
    }

    // 4. Check notifications for charlene@swipeup-marketing.com
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', charleneSwipeup.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
    } else {
      console.log('🔔 Recent notifications for charlene@swipeup-marketing.com:', notifications);
      
      const chatNotifications = notifications?.filter(n => n.title.includes('Chat-Nachricht'));
      console.log('💬 Chat notifications specifically:', chatNotifications);
    }

    // 5. Test creating a notification manually
    console.log('🧪 Creating test notification...');
    
    const testNotification = {
      user_id: charleneSwipeup.id,
      title: '💬 Test Chat-Nachricht',
      message: `${charleneNowak.first_name} ${charleneNowak.last_name}: Test-Nachricht um ${new Date().toLocaleTimeString()}`,
      type: 'info',
      related_case_study_id: sharedConversations[0] || 'test-conv',
      read: false
    };

    console.log('🧪 Test notification data:', testNotification);

    const { data: createdNotif, error: createError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test notification:', createError);
    } else {
      console.log('✅ Test notification created:', createdNotif);
      console.log('🔔 Check the bell for charlene@swipeup-marketing.com!');
    }

    return {
      users,
      sharedConversations,
      notifications,
      testNotification: createdNotif
    };

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Make function available globally
window.debugSpecificUsers = debugSpecificUsers;

console.log('🔍 Debug function loaded. Run debugSpecificUsers() to debug the specific user issue.');
