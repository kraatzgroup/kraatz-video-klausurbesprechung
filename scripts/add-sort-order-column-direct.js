const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addSortOrderColumn() {
  try {
    console.log('🔧 Adding sort_order column to video_lessons table...')
    
    // First, try to add the column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE video_lessons 
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        
        CREATE INDEX IF NOT EXISTS idx_video_lessons_sort_order 
        ON video_lessons(sort_order);
        
        UPDATE video_lessons 
        SET sort_order = (
          SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC) 
          FROM (SELECT id, created_at FROM video_lessons ORDER BY created_at ASC) AS ordered_videos 
          WHERE ordered_videos.id = video_lessons.id
        )
        WHERE sort_order = 0 OR sort_order IS NULL;
      `
    })

    if (error) {
      console.error('❌ Error executing SQL:', error)
      console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:')
      console.log(`
ALTER TABLE video_lessons 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_video_lessons_sort_order 
ON video_lessons(sort_order);

UPDATE video_lessons 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC) 
  FROM (SELECT id, created_at FROM video_lessons ORDER BY created_at ASC) AS ordered_videos 
  WHERE ordered_videos.id = video_lessons.id
)
WHERE sort_order = 0 OR sort_order IS NULL;
      `)
      return
    }

    console.log('✅ sort_order column added successfully!')
    
    // Verify the column was added
    const { data: videos, error: verifyError } = await supabase
      .from('video_lessons')
      .select('id, title, sort_order')
      .limit(3)

    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError)
    } else {
      console.log('✅ Verification successful. Sample videos:')
      videos.forEach(video => {
        console.log(`- ${video.title}: sort_order = ${video.sort_order}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addSortOrderColumn()
