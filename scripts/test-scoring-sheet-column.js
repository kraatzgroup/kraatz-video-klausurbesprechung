const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testScoringSheetColumn() {
  try {
    console.log('Testing if scoring_sheet_url column exists by attempting an update...')
    
    // First get an existing case study request
    const { data: existingRequests, error: fetchError } = await supabase
      .from('case_study_requests')
      .select('id')
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing requests:', fetchError)
      return false
    }

    if (!existingRequests || existingRequests.length === 0) {
      console.log('No existing case study requests found to test with.')
      return false
    }

    const testId = existingRequests[0].id
    console.log(`Testing with case study request ID: ${testId}`)

    // Try to update the scoring_sheet_url field
    const { data, error } = await supabase
      .from('case_study_requests')
      .update({ scoring_sheet_url: 'test-url' })
      .eq('id', testId)
      .select()

    if (error) {
      if (error.message.includes('scoring_sheet_url')) {
        console.log('❌ Column scoring_sheet_url does not exist')
        console.log('')
        console.log('Manual action required:')
        console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/rpgbyockvpannrupicno')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Execute this SQL:')
        console.log('   ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;')
        console.log('   CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);')
        return false
      } else {
        console.error('Unexpected error:', error)
        return false
      }
    } else {
      console.log('✅ Column scoring_sheet_url exists and is working!')
      
      // Clean up - set back to null
      await supabase
        .from('case_study_requests')
        .update({ scoring_sheet_url: null })
        .eq('id', testId)
      
      console.log('Test completed successfully. Excel upload functionality should work now.')
      return true
    }

  } catch (error) {
    console.error('Script error:', error)
    return false
  }
}

testScoringSheetColumn()
