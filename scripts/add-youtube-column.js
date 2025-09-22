const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addYouTubeColumn() {
  try {
    console.log('Adding youtube_id column to video_lessons table...')
    
    // Add youtube_id column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE video_lessons 
        ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(255);
      `
    })

    if (error) {
      console.error('Error adding column:', error)
      return
    }

    console.log('YouTube ID column added successfully!')
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

addYouTubeColumn()
