const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChatNotifications() {
  console.log('🔍 Debugging chat notifications for charlenenowak@gmx.de');
  
  try {
    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'charlenenowak@gmx.de')
      .single();
    
    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role
    });
    
    // 2. Check conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations(*)
      `)
      .eq('user_id', user.id);
    
    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return;
    }
    
    console.log('💬 User conversations:', conversations?.length || 0);
    
    // 3. Check recent notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
      return;
    }
    
    console.log('🔔 Recent notifications:', notifications?.length || 0);
    notifications?.forEach(notif => {
      console.log(`  - ${notif.title}: ${notif.message} (${notif.read ? 'read' : 'unread'})`);
    });
    
    // 4. Check recent messages
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.conversation_id);
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return;
      }
      
      console.log('📨 Recent messages:', messages?.length || 0);
      messages?.forEach(msg => {
        console.log(`  - ${msg.content} (${msg.created_at})`);
      });
    }
    
    // 5. Test notification creation
    console.log('🧪 Testing notification creation...');
    
    const testResult = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: '🧪 Test Chat-Nachricht',
        message: 'Test User: Dies ist eine Test-Nachricht',
        type: 'info',
        read: false
      });
    
    if (testResult.error) {
      console.error('❌ Error creating test notification:', testResult.error);
    } else {
      console.log('✅ Test notification created successfully');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugChatNotifications();
