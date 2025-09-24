// Simulate a chat message from charlenenowak@gmx.de to charlene@swipeup-marketing.com
// This will help us test the notification system end-to-end

async function simulateChatMessage() {
  try {
    console.log('🎭 Simulating chat message...');
    
    const supabase = window.supabase;
    if (!supabase) {
      console.error('❌ Supabase not available');
      return;
    }

    // 1. Get both users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['charlenenowak@gmx.de', 'charlene@swipeup-marketing.com']);

    if (usersError || !users || users.length < 2) {
      console.error('❌ Could not find both users:', usersError);
      return;
    }

    const sender = users.find(u => u.email === 'charlenenowak@gmx.de');
    const recipient = users.find(u => u.email === 'charlene@swipeup-marketing.com');

    console.log('👤 Sender:', sender);
    console.log('👤 Recipient:', recipient);

    // 2. Find or create a conversation between them
    let conversationId = null;

    // Check for existing conversation
    const { data: existingConvs, error: convError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [sender.id, recipient.id]);

    if (convError) {
      console.error('❌ Error checking conversations:', convError);
      return;
    }

    // Find shared conversation
    const conversationCounts = {};
    existingConvs?.forEach(cp => {
      conversationCounts[cp.conversation_id] = (conversationCounts[cp.conversation_id] || 0) + 1;
    });

    const sharedConversation = Object.keys(conversationCounts).find(
      convId => conversationCounts[convId] === 2
    );

    if (sharedConversation) {
      conversationId = sharedConversation;
      console.log('💬 Using existing conversation:', conversationId);
    } else {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          title: `Chat zwischen ${sender.first_name} und ${recipient.first_name}`,
          type: 'support',
          created_by: sender.id
        })
        .select()
        .single();

      if (newConvError) {
        console.error('❌ Error creating conversation:', newConvError);
        return;
      }

      conversationId = newConv.id;
      console.log('💬 Created new conversation:', conversationId);

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: sender.id },
          { conversation_id: conversationId, user_id: recipient.id }
        ]);

      if (participantsError) {
        console.error('❌ Error adding participants:', participantsError);
        return;
      }

      console.log('👥 Added participants to conversation');
    }

    // 3. Create a test message
    const messageContent = `Test-Nachricht um ${new Date().toLocaleTimeString()} - Dies ist ein Test der Chat-Benachrichtigungen!`;
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        content: messageContent,
        message_type: 'text'
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error creating message:', messageError);
      return;
    }

    console.log('📨 Created message:', message);

    // 4. Manually create the notification (simulating what should happen automatically)
    const senderName = `${sender.first_name} ${sender.last_name}`;
    const notificationData = {
      user_id: recipient.id,
      title: '💬 Neue Chat-Nachricht',
      message: `${senderName}: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`,
      type: 'info',
      related_case_study_id: conversationId,
      read: false
    };

    console.log('🔔 Creating notification:', notificationData);

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      return;
    }

    console.log('✅ Notification created successfully:', notification);
    console.log('🔔 Check the bell for charlene@swipeup-marketing.com!');

    // 5. Verify the notification was created
    const { data: verifyNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();

    console.log('✅ Verification - notification exists:', verifyNotif);

    return {
      conversationId,
      message,
      notification,
      verification: verifyNotif
    };

  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
}

// Make function available globally
window.simulateChatMessage = simulateChatMessage;

console.log('🎭 Simulation function loaded. Run simulateChatMessage() to test the full flow.');
