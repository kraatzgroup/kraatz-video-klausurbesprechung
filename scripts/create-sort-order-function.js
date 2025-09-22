const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSortOrderFunction() {
  try {
    console.log('Creating database function to add sort_order column...')
    
    // Create a function that adds the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION add_sort_order_column()
        RETURNS void AS $$
        BEGIN
          -- Add column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'video_lessons' AND column_name = 'sort_order'
          ) THEN
            ALTER TABLE video_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;
            CREATE INDEX idx_video_lessons_sort_order ON video_lessons(sort_order);
            
            -- Update existing videos with sort order based on creation date
            WITH ordered_videos AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
              FROM video_lessons
            )
            UPDATE video_lessons 
            SET sort_order = ordered_videos.rn
            FROM ordered_videos
            WHERE video_lessons.id = ordered_videos.id;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (error) {
      console.error('Error creating function:', error)
      return false
    }

    console.log('Function created successfully. Executing...')

    // Execute the function
    const { data: execData, error: execError } = await supabase.rpc('add_sort_order_column')

    if (execError) {
      console.error('Error executing function:', execError)
      return false
    }

    console.log('sort_order column added successfully!')
    return true

  } catch (error) {
    console.error('Script error:', error)
    return false
  }
}

createSortOrderFunction()
