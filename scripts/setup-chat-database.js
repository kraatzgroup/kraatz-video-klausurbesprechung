const { createDatabaseClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function setupChatDatabase() {
  const client = createDatabaseClient();
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/create-chat-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Creating chat database schema...');
    
    // Execute the schema
    await client.query(schema);
    
    console.log('✅ Chat database schema created successfully!');
    console.log('\n📊 Created tables:');
    console.log('  - conversations (Chat-Räume/Konversationen)');
    console.log('  - conversation_participants (Teilnehmer)');
    console.log('  - messages (Chat-Nachrichten)');
    console.log('\n🔒 RLS Policies configured:');
    console.log('  - Students: Can only chat with Admins (support)');
    console.log('  - Admin/Instructor/Springer: Can chat with each other');
    console.log('  - Users can only see conversations they participate in');
    console.log('\n🎯 Additional features:');
    console.log('  - Unread message counting function');
    console.log('  - Conversation details view');
    console.log('  - Performance indexes');
    console.log('  - Auto-updating timestamps');

  } catch (error) {
    console.error('❌ Error setting up chat database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
if (require.main === module) {
  setupChatDatabase()
    .then(() => {
      console.log('\n🎉 Chat database setup completed!');
      console.log('Next steps:');
      console.log('1. Implement React chat components');
      console.log('2. Add chat hooks for data management');
      console.log('3. Integrate real-time functionality');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupChatDatabase };
