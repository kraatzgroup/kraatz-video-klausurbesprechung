const { Client } = require('pg');

async function createStorageBucket() {
  const client = new Client({
    connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🚀 Creating chat-attachments storage bucket...');

    // Create the storage bucket via SQL
    const createBucketSQL = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'chat-attachments',
        'chat-attachments', 
        true,
        10485760,
        ARRAY[
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'application/pdf', 'text/plain',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip', 'application/x-rar-compressed',
          'audio/mpeg', 'audio/wav', 'video/mp4'
        ]
      )
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
    `;

    await client.query(createBucketSQL);
    console.log('✅ Storage bucket "chat-attachments" created/updated successfully');

    // Create RLS policies for the bucket (separately to avoid syntax issues)
    try {
      await client.query(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
      console.log('✅ RLS enabled on storage.objects');
    } catch (e) {
      console.log('ℹ️ RLS already enabled on storage.objects');
    }

    // Create policies one by one
    try {
      await client.query(`
        CREATE POLICY "Users can upload to own folder in chat-attachments" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
          bucket_id = 'chat-attachments' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `);
      console.log('✅ Upload policy created');
    } catch (e) {
      console.log('ℹ️ Upload policy already exists');
    }

    try {
      await client.query(`
        CREATE POLICY "Authenticated users can view chat-attachments" 
        ON storage.objects FOR SELECT 
        USING (
          bucket_id = 'chat-attachments' 
          AND auth.role() = 'authenticated'
        );
      `);
      console.log('✅ View policy created');
    } catch (e) {
      console.log('ℹ️ View policy already exists');
    }

    try {
      await client.query(`
        CREATE POLICY "Users can delete own files in chat-attachments" 
        ON storage.objects FOR DELETE 
        USING (
          bucket_id = 'chat-attachments' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `);
      console.log('✅ Delete policy created');
    } catch (e) {
      console.log('ℹ️ Delete policy already exists');
    }

    console.log('\n🎉 Storage bucket setup completed successfully!');
    console.log('\n📋 Bucket details:');
    console.log('  - Name: chat-attachments');
    console.log('  - Public: Yes');
    console.log('  - File size limit: 10MB');
    console.log('  - Allowed types: Images, Documents, Archives, Audio/Video');
    console.log('\n🔧 You can now upload files in the chat!');

  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('✅ Storage bucket "chat-attachments" already exists');
      console.log('🔧 You can now upload files in the chat!');
    } else {
      console.error('❌ Error creating storage bucket:', error);
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
if (require.main === module) {
  createStorageBucket()
    .then(() => {
      console.log('\n✅ Storage bucket setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createStorageBucket };
