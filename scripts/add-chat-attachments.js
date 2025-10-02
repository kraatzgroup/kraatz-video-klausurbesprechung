const { Client } = require('pg');

async function addChatAttachments() {
  const client = new Client({
    connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🚀 Adding chat attachment support...');

    // 1. Add attachment columns to messages table
    await client.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS attachment_size BIGINT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT;
    `);

    // 2. Update message_type constraint
    await client.query(`
      ALTER TABLE messages 
      DROP CONSTRAINT IF EXISTS messages_message_type_check;
    `);
    
    await client.query(`
      ALTER TABLE messages 
      ADD CONSTRAINT messages_message_type_check 
      CHECK (message_type IN ('text', 'system', 'file', 'image'));
    `);

    // 3. Add index for attachment queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_attachment_type ON messages(attachment_type);
    `);
    console.log('✅ Added attachment columns to messages table');

    // 2. Create file_uploads table for tracking uploads
    const createFileUploadsTable = `
      -- Create file_uploads table for tracking file uploads
      CREATE TABLE IF NOT EXISTS file_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        upload_path TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_used BOOLEAN DEFAULT FALSE,
        used_in_message_id UUID REFERENCES messages(id) ON DELETE SET NULL
      );

      -- Add indexes for file_uploads
      CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
      CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);
    `;

    await client.query(createFileUploadsTable);
    console.log('✅ Created file_uploads table');

    // 3. Set up RLS policies for file_uploads
    await client.query(`ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies if they exist, then create new ones
    try {
      await client.query(`DROP POLICY IF EXISTS "Users can view own file uploads" ON file_uploads;`);
      await client.query(`DROP POLICY IF EXISTS "Users can insert own file uploads" ON file_uploads;`);
      await client.query(`DROP POLICY IF EXISTS "Users can update own file uploads" ON file_uploads;`);
      await client.query(`DROP POLICY IF EXISTS "Users can delete own file uploads" ON file_uploads;`);
    } catch (e) {
      // Policies might not exist yet, that's ok
    }

    await client.query(`
      CREATE POLICY "Users can view own file uploads" ON file_uploads
        FOR SELECT USING (auth.uid() = user_id);
    `);

    await client.query(`
      CREATE POLICY "Users can insert own file uploads" ON file_uploads
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `);

    await client.query(`
      CREATE POLICY "Users can update own file uploads" ON file_uploads
        FOR UPDATE USING (auth.uid() = user_id);
    `);

    await client.query(`
      CREATE POLICY "Users can delete own file uploads" ON file_uploads
        FOR DELETE USING (auth.uid() = user_id);
    `);
    console.log('✅ Set up RLS policies for file uploads');

    // 4. Create storage bucket for chat attachments (SQL function to call via API)
    const createStorageBucket = `
      -- Function to create storage bucket (to be called via Supabase API)
      CREATE OR REPLACE FUNCTION create_chat_attachments_bucket()
      RETURNS TEXT AS $$
      BEGIN
        -- This function documents the storage bucket configuration
        -- The actual bucket creation should be done via Supabase dashboard or API
        RETURN 'chat-attachments bucket should be created with public read access';
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(createStorageBucket);
    console.log('✅ Created storage bucket helper function');

    console.log('\n🎉 Chat attachment support added successfully!');
    console.log('\n📊 Database changes:');
    console.log('  - Added attachment columns to messages table');
    console.log('  - Extended message_type to include file and image types');
    console.log('  - Created file_uploads table for tracking uploads');
    console.log('  - Set up RLS policies for secure file access');
    console.log('\n📁 Storage setup needed:');
    console.log('  1. Create "chat-attachments" bucket in Supabase Storage');
    console.log('  2. Set bucket to public read access');
    console.log('  3. Configure file size limits (e.g., 10MB max)');
    console.log('\n🔧 Next steps:');
    console.log('  1. Update React components to handle file uploads');
    console.log('  2. Add file upload hooks and utilities');
    console.log('  3. Implement file preview and download functionality');

  } catch (error) {
    console.error('❌ Error adding chat attachment support:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
if (require.main === module) {
  addChatAttachments()
    .then(() => {
      console.log('\n✅ Chat attachment setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { addChatAttachments };
