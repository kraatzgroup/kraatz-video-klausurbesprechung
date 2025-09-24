require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColumnManually() {
  try {
    console.log('Attempting to add sort_order column using direct HTTP request...')
    
    // Use fetch to make direct HTTP request to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE video_lessons ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;'
      })
    })

    if (!response.ok) {
      console.log('Direct HTTP approach failed. Trying alternative method...')
      
      // Try to use the PostgREST API directly
      const alterResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: 'ALTER TABLE video_lessons ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0'
        })
      })

      if (!alterResponse.ok) {
        console.log('All automatic methods failed.')
        console.log('Manual intervention required in Supabase dashboard.')
        console.log('Please execute this SQL in the Supabase SQL editor:')
        console.log('')
        console.log('ALTER TABLE video_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;')
        console.log('CREATE INDEX idx_video_lessons_sort_order ON video_lessons(sort_order);')
        console.log('')
        console.log('Then update existing videos:')
        console.log('UPDATE video_lessons SET sort_order = (SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC) FROM (SELECT id, created_at FROM video_lessons ORDER BY created_at ASC) AS ordered WHERE ordered.id = video_lessons.id);')
        return false
      }
    }

    console.log('Column added successfully!')
    return true

  } catch (error) {
    console.error('Error:', error)
    console.log('')
    console.log('Please manually add the sort_order column in Supabase dashboard:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Execute this SQL:')
    console.log('')
    console.log('ALTER TABLE video_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;')
    console.log('CREATE INDEX idx_video_lessons_sort_order ON video_lessons(sort_order);')
    console.log('')
    console.log('4. Update existing videos with initial sort order:')
    console.log('WITH ordered_videos AS (')
    console.log('  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn')
    console.log('  FROM video_lessons')
    console.log(')')
    console.log('UPDATE video_lessons')
    console.log('SET sort_order = ordered_videos.rn')
    console.log('FROM ordered_videos')
    console.log('WHERE video_lessons.id = ordered_videos.id;')
    
    return false
  }
}

addColumnManually()
