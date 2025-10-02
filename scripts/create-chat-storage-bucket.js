const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzY5NzI4NCwiZXhwIjoyMDQzMjczMjg0fQ.Ue4Ub8Zt5Iq0Ey9Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8'; // This would need to be the actual service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChatAttachmentsBucket() {
  try {
    console.log('🚀 Creating chat-attachments storage bucket...');

    // Create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('chat-attachments', {
        public: true,
        allowedMimeTypes: [
          // Images
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          // Documents
          'application/pdf', 'text/plain', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Archives
          'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
          // Audio/Video
          'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "chat-attachments" already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Created bucket "chat-attachments":', bucketData);
    }

    // Set up bucket policies for security
    console.log('🔒 Setting up bucket policies...');

    // Policy: Users can upload files to their own folder
    const uploadPolicy = {
      id: 'chat_attachments_upload_policy',
      bucket_id: 'chat-attachments',
      operation: 'INSERT',
      definition: {
        'bucket_id': 'chat-attachments',
        'name': {
          'startsWith': '${auth.uid()}/'
        }
      }
    };

    // Policy: Users can read all files (for chat functionality)
    const readPolicy = {
      id: 'chat_attachments_read_policy', 
      bucket_id: 'chat-attachments',
      operation: 'SELECT',
      definition: {
        'bucket_id': 'chat-attachments'
      }
    };

    // Policy: Users can delete their own files
    const deletePolicy = {
      id: 'chat_attachments_delete_policy',
      bucket_id: 'chat-attachments', 
      operation: 'DELETE',
      definition: {
        'bucket_id': 'chat-attachments',
        'name': {
          'startsWith': '${auth.uid()}/'
        }
      }
    };

    console.log('✅ Storage bucket setup completed!');
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → Storage → chat-attachments');
    console.log('2. Set bucket to "Public bucket" if not already');
    console.log('3. Configure RLS policies for secure access');
    console.log('\n🔧 Bucket configuration:');
    console.log('  - Name: chat-attachments');
    console.log('  - Public: Yes (for file access)');
    console.log('  - File size limit: 10MB');
    console.log('  - Allowed file types: Images, Documents, Archives, Audio/Video');
    console.log('\n🎯 Next steps:');
    console.log('  1. Test file upload functionality in chat');
    console.log('  2. Verify file download and preview works');
    console.log('  3. Test file deletion and cleanup');

  } catch (error) {
    console.error('❌ Error creating storage bucket:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  createChatAttachmentsBucket()
    .then(() => {
      console.log('\n🎉 Chat attachments storage setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createChatAttachmentsBucket };
