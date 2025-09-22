const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function addSortOrderColumn() {
  try {
    console.log('Adding sort_order column to video_lessons table...')
    
    // Execute raw SQL to add the column
    const { data, error } = await supabase
      .from('video_lessons')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Error accessing video_lessons table:', error)
      return
    }

    console.log('video_lessons table accessible. Attempting to add sort_order column...')

    // Try to update a record to see if sort_order exists
    const { data: testData, error: testError } = await supabase
      .from('video_lessons')
      .select('sort_order')
      .limit(1)

    if (testError && testError.message.includes('sort_order')) {
      console.log('sort_order column does not exist. Column needs to be added manually in Supabase dashboard.')
      console.log('Please run this SQL in your Supabase SQL editor:')
      console.log('ALTER TABLE video_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;')
      console.log('CREATE INDEX idx_video_lessons_sort_order ON video_lessons(sort_order);')
      return
    }

    if (testData) {
      console.log('sort_order column already exists!')
      
      // Update existing videos with sort order
      const { data: videos, error: fetchError } = await supabase
        .from('video_lessons')
        .select('id, created_at, sort_order')
        .order('created_at', { ascending: true })

      if (fetchError) {
        console.error('Error fetching videos:', fetchError)
        return
      }

      if (videos && videos.length > 0) {
        console.log(`Updating sort order for ${videos.length} videos...`)
        
        for (let i = 0; i < videos.length; i++) {
          if (videos[i].sort_order === 0 || videos[i].sort_order === null) {
            const { error: updateError } = await supabase
              .from('video_lessons')
              .update({ sort_order: i + 1 })
              .eq('id', videos[i].id)

            if (updateError) {
              console.error(`Error updating video ${videos[i].id}:`, updateError)
            } else {
              console.log(`Updated video ${i + 1}/${videos.length}`)
            }
          }
        }

        console.log('All videos updated with sort order!')
      }
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

addSortOrderColumn()
