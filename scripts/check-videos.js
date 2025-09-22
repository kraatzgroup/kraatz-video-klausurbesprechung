const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVideos() {
  try {
    console.log('🔍 Checking video_lessons table...')
    
    // Check if table exists and get all videos
    const { data, error } = await supabase
      .from('video_lessons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error querying video_lessons:', error)
      return
    }

    console.log(`✅ Found ${data.length} videos in database:`)
    
    if (data.length === 0) {
      console.log('📝 No videos found. The table is empty.')
    } else {
      data.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`)
        console.log(`   ID: ${video.id}`)
        console.log(`   Created: ${video.created_at}`)
        console.log(`   Active: ${video.is_active}`)
        console.log(`   Sort Order: ${video.sort_order || 'null'}`)
        console.log(`   URL: ${video.video_url}`)
        console.log('   ---')
      })
    }

    // Check table structure
    console.log('\n🔧 Checking table structure...')
    const { data: columns, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'video_lessons' })
      .single()

    if (structureError) {
      console.log('⚠️  Could not check table structure, but videos query worked')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkVideos()
