require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSortOrderColumn() {
  try {
    console.log('Attempting to add sort_order column via RPC...')
    
    // Try using a custom RPC function or direct SQL execution
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'video_lessons' AND column_name = 'sort_order'
          ) THEN
            ALTER TABLE video_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;
            CREATE INDEX IF NOT EXISTS idx_video_lessons_sort_order ON video_lessons(sort_order);
          END IF;
        END $$;
      `
    })

    if (error) {
      console.log('RPC method failed, trying alternative approach...')
      
      // Alternative: Try to insert a test record with sort_order to trigger column creation
      const { data: testInsert, error: insertError } = await supabase
        .from('video_lessons')
        .insert({
          title: '__TEST_SORT_ORDER__',
          description: 'Test',
          video_url: 'test',
          duration: 0,
          is_active: false,
          category: 'test',
          sort_order: 999
        })
        .select()

      if (insertError) {
        if (insertError.message.includes('sort_order')) {
          console.log('Column does not exist. Will simulate the functionality without database changes.')
          console.log('The sort order will work in the UI but won\'t persist between sessions.')
          return false
        }
      } else {
        // Delete the test record
        await supabase
          .from('video_lessons')
          .delete()
          .eq('title', '__TEST_SORT_ORDER__')
        
        console.log('sort_order column exists! Updating existing videos...')
        return true
      }
    } else {
      console.log('Column added successfully via RPC!')
      return true
    }

  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

async function updateExistingVideos() {
  try {
    const { data: videos, error } = await supabase
      .from('video_lessons')
      .select('id, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching videos:', error)
      return
    }

    if (videos && videos.length > 0) {
      console.log(`Updating ${videos.length} videos with sort order...`)
      
      for (let i = 0; i < videos.length; i++) {
        const { error: updateError } = await supabase
          .from('video_lessons')
          .update({ sort_order: i + 1 })
          .eq('id', videos[i].id)

        if (updateError) {
          console.error(`Error updating video ${videos[i].id}:`, updateError)
        }
      }
      
      console.log('All videos updated!')
    }
  } catch (error) {
    console.error('Error updating videos:', error)
  }
}

async function main() {
  const columnAdded = await addSortOrderColumn()
  if (columnAdded) {
    await updateExistingVideos()
  }
}

main()
