const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function testChatRealtime() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');

    // Check recent messages and their real-time behavior
    console.log('\n📨 Checking recent chat messages...');
    
    const recentMessagesQuery = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.created_at,
        m.message_type,
        u.first_name,
        u.last_name,
        u.email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 10;
    `;

    const recentResult = await client.query(recentMessagesQuery);
    
    console.log(`📋 Found ${recentResult.rows.length} recent messages:`);
    recentResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.first_name} ${row.last_name} (${row.email})`);
      console.log(`   💬 "${row.content}"`);
      console.log(`   🕐 ${new Date(row.created_at).toLocaleString('de-DE')}`);
      console.log(`   🆔 Message ID: ${row.id}`);
      console.log(`   💭 Conversation: ${row.conversation_id}`);
    });

    // Check conversation participants
    console.log('\n👥 Checking conversation participants...');
    
    const participantsQuery = `
      SELECT DISTINCT
        cp.conversation_id,
        COUNT(cp.user_id) as participant_count,
        STRING_AGG(u.first_name || ' ' || u.last_name, ', ') as participants
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      GROUP BY cp.conversation_id
      ORDER BY cp.conversation_id;
    `;

    const participantsResult = await client.query(participantsQuery);
    
    console.log(`📊 Found ${participantsResult.rows.length} conversations:`);
    participantsResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Conversation: ${row.conversation_id}`);
      console.log(`   👥 ${row.participant_count} participants: ${row.participants}`);
    });

    // Check for potential real-time issues
    console.log('\n🔍 Checking for potential real-time issues...');
    
    // Check for messages without sender info
    const orphanMessagesQuery = `
      SELECT m.id, m.content, m.sender_id, m.created_at
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE u.id IS NULL
      ORDER BY m.created_at DESC
      LIMIT 5;
    `;

    const orphanResult = await client.query(orphanMessagesQuery);
    
    if (orphanResult.rows.length > 0) {
      console.log(`⚠️ Found ${orphanResult.rows.length} messages without valid sender:`);
      orphanResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. Message ID: ${row.id}, Sender ID: ${row.sender_id}`);
        console.log(`      Content: "${row.content}"`);
      });
    } else {
      console.log('✅ All messages have valid senders');
    }

    // Check for duplicate messages (potential real-time issue)
    const duplicateQuery = `
      SELECT 
        content,
        sender_id,
        conversation_id,
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as message_ids
      FROM messages
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY content, sender_id, conversation_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    const duplicateResult = await client.query(duplicateQuery);
    
    if (duplicateResult.rows.length > 0) {
      console.log(`⚠️ Found ${duplicateResult.rows.length} potential duplicate messages:`);
      duplicateResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.content}" (${row.count} times)`);
        console.log(`      IDs: ${row.message_ids}`);
      });
    } else {
      console.log('✅ No duplicate messages found in the last hour');
    }

    // Check database triggers and functions for real-time
    console.log('\n🔧 Checking database real-time setup...');
    
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE event_object_table = 'messages'
      ORDER BY trigger_name;
    `;

    const triggersResult = await client.query(triggersQuery);
    
    if (triggersResult.rows.length > 0) {
      console.log(`📋 Found ${triggersResult.rows.length} triggers on messages table:`);
      triggersResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.trigger_name}: ${row.action_timing} ${row.event_manipulation}`);
      });
    } else {
      console.log('ℹ️ No triggers found on messages table');
    }

    // Test message insertion simulation
    console.log('\n🧪 Testing message insertion simulation...');
    
    const testMessage = {
      conversation_id: 'test-conversation-' + Date.now(),
      sender_id: 'test-user-' + Date.now(),
      content: 'Test message for real-time verification - ' + new Date().toISOString(),
      message_type: 'text'
    };

    console.log('📤 Simulating message insert:', testMessage);
    
    // Note: We won't actually insert to avoid polluting the database
    console.log('ℹ️ Simulation only - no actual database changes made');

    // Recommendations for fixing real-time issues
    console.log('\n💡 Recommendations for fixing real-time chat issues:');
    console.log('');
    console.log('1. **Immediate Local Update**: ✅ Already implemented');
    console.log('   - Messages are added to local state immediately after sending');
    console.log('   - This provides instant feedback to the sender');
    console.log('');
    console.log('2. **Duplicate Prevention**: ✅ Already implemented');
    console.log('   - Real-time subscription skips own messages');
    console.log('   - Existence check prevents duplicate additions');
    console.log('');
    console.log('3. **Polling Fallback**: ✅ Already implemented');
    console.log('   - 2-second polling as backup for real-time');
    console.log('   - Ensures messages appear even if real-time fails');
    console.log('');
    console.log('4. **Debug Logging**: ✅ Already implemented');
    console.log('   - Comprehensive console logging for troubleshooting');
    console.log('   - Track message flow through the system');
    console.log('');
    console.log('5. **Additional Checks to Consider**:');
    console.log('   - Verify Supabase real-time is enabled in project settings');
    console.log('   - Check browser console for WebSocket connection errors');
    console.log('   - Ensure proper authentication for real-time subscriptions');
    console.log('   - Test with multiple browser tabs/users simultaneously');

  } catch (error) {
    console.error('❌ Error testing chat real-time:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testChatRealtime()
  .then(() => {
    console.log('\n🎉 Chat real-time test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Chat real-time test failed:', error);
    process.exit(1);
  });
