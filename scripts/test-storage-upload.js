const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTM1MTksImV4cCI6MjA3MTk2OTUxOX0._zvzPGXEkQLh-_IcmS7JcgndKbOq6eD3SViizKH0oos'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorageUpload() {
  try {
    // Test authentication first
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@kraatz-club.de',
      password: 'Demo123!'
    })

    if (authError) {
      console.error('Authentication failed:', authError)
      return
    }

    console.log('✅ Authentication successful')

    // Test bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError)
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name))
    }

    // Test file upload with a simple text file
    const testFile = new File(['Test content for upload'], 'test-upload.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('case-studies')
      .upload(`test_${Date.now()}.txt`, testFile)

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
    } else {
      console.log('✅ Upload successful:', uploadData)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-studies')
        .getPublicUrl(uploadData.path)
      
      console.log('✅ Public URL:', urlData.publicUrl)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testStorageUpload()
