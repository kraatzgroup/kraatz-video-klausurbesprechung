require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateStorageConfig() {
  try {
    console.log('Updating storage bucket configuration...')
    
    // Update bucket file size limit to 5GB
    const { data, error } = await supabase.rpc('update_bucket_file_size_limit', {
      bucket_id: 'video-lessons',
      new_limit: 5368709120 // 5GB in bytes
    })

    if (error) {
      console.error('Error updating bucket:', error)
      
      // Try alternative approach - direct SQL
      const { data: sqlData, error: sqlError } = await supabase
        .from('storage.buckets')
        .update({ file_size_limit: 5368709120 })
        .eq('id', 'video-lessons')

      if (sqlError) {
        console.error('SQL Error:', sqlError)
        return
      }
    }

    console.log('Storage bucket updated successfully!')
    
    // Verify the update
    const { data: buckets, error: fetchError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('id', 'video-lessons')

    if (fetchError) {
      console.error('Error fetching bucket info:', fetchError)
    } else {
      console.log('Current bucket configuration:', buckets)
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

updateStorageConfig()
