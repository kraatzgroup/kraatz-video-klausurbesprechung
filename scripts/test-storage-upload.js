const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

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
