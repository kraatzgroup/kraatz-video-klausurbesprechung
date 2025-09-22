const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSortOrderColumn() {
  try {
    console.log('Adding sort_order column to video_lessons table...')
    
    // First, add the column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE video_lessons 
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
      `
    })

    if (addColumnError) {
      console.error('Error adding column:', addColumnError)
      return
    }

    console.log('sort_order column added successfully!')

    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_video_lessons_sort_order ON video_lessons(sort_order);
      `
    })

    if (indexError) {
      console.error('Error creating index:', indexError)
      return
    }

    console.log('Index created successfully!')

    // Update existing videos with sort order based on creation date
    const { data: videos, error: fetchError } = await supabase
      .from('video_lessons')
      .select('id, created_at')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching videos:', fetchError)
      return
    }

    if (videos && videos.length > 0) {
      console.log(`Updating sort order for ${videos.length} existing videos...`)
      
      for (let i = 0; i < videos.length; i++) {
        const { error: updateError } = await supabase
          .from('video_lessons')
          .update({ sort_order: i + 1 })
          .eq('id', videos[i].id)

        if (updateError) {
          console.error(`Error updating video ${videos[i].id}:`, updateError)
        }
      }

      console.log('All videos updated with sort order!')
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

addSortOrderColumn()
