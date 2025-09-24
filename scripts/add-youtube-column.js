require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

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
