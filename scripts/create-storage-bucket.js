const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createStorageBucket() {
  try {
    console.log('Creating case-studies storage bucket...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('case-studies', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 10485760 // 10MB
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists')
      } else {
        throw error
      }
    } else {
      console.log('✅ Bucket created successfully:', data)
    }

    // Set up RLS policy for the bucket
    console.log('Setting up storage policies...')
    
    // Allow authenticated users to upload files
    const { error: policyError1 } = await supabase.rpc('create_policy', {
      policy_name: 'Allow authenticated uploads',
      table_name: 'objects',
      schema_name: 'storage',
      definition: 'bucket_id = \'case-studies\' AND auth.role() = \'authenticated\'',
      check: null,
      command: 'INSERT'
    })

    // Allow public read access
    const { error: policyError2 } = await supabase.rpc('create_policy', {
      policy_name: 'Allow public downloads',
      table_name: 'objects', 
      schema_name: 'storage',
      definition: 'bucket_id = \'case-studies\'',
      check: null,
      command: 'SELECT'
    })

    if (policyError1 && !policyError1.message.includes('already exists')) {
      console.warn('Policy creation warning:', policyError1)
    }
    if (policyError2 && !policyError2.message.includes('already exists')) {
      console.warn('Policy creation warning:', policyError2)
    }

    console.log('✅ Storage bucket setup complete!')
    
  } catch (error) {
    console.error('❌ Error creating storage bucket:', error)
  }
}

createStorageBucket()
