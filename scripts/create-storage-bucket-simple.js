const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createChatAttachmentsBucket() {
  try {
    console.log('🚀 Creating chat-attachments storage bucket...');

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('chat-attachments', {
      public: true,
      allowedMimeTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip'
      ],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "chat-attachments" already exists');
        return true;
      } else {
        console.error('❌ Error creating bucket:', error);
        return false;
      }
    }

    console.log('✅ Successfully created bucket "chat-attachments"');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the function
createChatAttachmentsBucket()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Storage bucket setup completed!');
      console.log('You can now upload files in the chat.');
    } else {
      console.log('\n❌ Storage bucket setup failed.');
      console.log('Please create the bucket manually in Supabase Dashboard.');
    }
  })
  .catch((error) => {
    console.error('Script failed:', error);
  });
