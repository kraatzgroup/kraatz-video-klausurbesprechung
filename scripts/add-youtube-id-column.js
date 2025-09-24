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
    
    // First, check if the column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'video_lessons')
      .eq('column_name', 'youtube_id')

    if (columnError) {
      console.error('Error checking columns:', columnError)
      return
    }

    if (columns && columns.length > 0) {
      console.log('youtube_id column already exists!')
      return
    }

    // Add the column using a direct SQL query
    const { data, error } = await supabase
      .from('video_lessons')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Error accessing video_lessons table:', error)
      return
    }

    console.log('video_lessons table exists. Column will be added via database migration.')
    console.log('Please run the SQL script manually in your Supabase SQL editor:')
    console.log('ALTER TABLE video_lessons ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(255);')
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

addYouTubeColumn()
