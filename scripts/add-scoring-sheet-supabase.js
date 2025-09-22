const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addScoringSheetColumn() {
  try {
    console.log('Testing if scoring_sheet_url column exists...')
    
    // Try to select scoring_sheet_url to see if column exists
    const { data, error } = await supabase
      .from('case_study_requests')
      .select('scoring_sheet_url')
      .limit(1)

    if (error && error.message.includes('scoring_sheet_url')) {
      console.log('Column does not exist. Please add it manually in Supabase dashboard.')
      console.log('')
      console.log('Go to your Supabase project dashboard:')
      console.log('1. Navigate to SQL Editor')
      console.log('2. Execute this SQL:')
      console.log('')
      console.log('ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;')
      console.log('CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);')
      console.log('')
      return false
    } else {
      console.log('✓ scoring_sheet_url column already exists!')
      return true
    }

  } catch (error) {
    console.error('Error checking column:', error)
    return false
  }
}

addScoringSheetColumn()
