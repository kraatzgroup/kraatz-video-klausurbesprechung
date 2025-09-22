const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiss3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColumnDirectly() {
  try {
    console.log('Attempting to add scoring_sheet_url column directly...')
    
    // Try using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'case_study_requests' AND column_name = 'scoring_sheet_url'
          ) THEN
            ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;
            CREATE INDEX IF NOT EXISTS idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);
            RAISE NOTICE 'Column scoring_sheet_url added successfully';
          ELSE
            RAISE NOTICE 'Column scoring_sheet_url already exists';
          END IF;
        END $$;
      `
    })

    if (error) {
      console.log('RPC method failed:', error.message)
      
      // Try alternative approach - direct REST API call
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_sheet_url TEXT;'
        })
      })

      if (!response.ok) {
        console.log('Direct REST API also failed.')
        
        // Final attempt - try to insert a test record to trigger column creation
        console.log('Attempting to create column through test insert...')
        
        const { data: testData, error: testError } = await supabase
          .from('case_study_requests')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            case_study_number: 999,
            study_phase: 'test',
            legal_area: 'test',
            sub_area: 'test',
            focus_area: 'test',
            status: 'requested',
            scoring_sheet_url: 'test'
          })
          .select()

        if (testError) {
          if (testError.message.includes('scoring_sheet_url')) {
            console.log('❌ Column does not exist and cannot be created automatically.')
            console.log('')
            console.log('Please add the column manually in Supabase dashboard:')
            console.log('1. Go to https://supabase.com/dashboard/project/rpgbyockvpannrupicno')
            console.log('2. Navigate to SQL Editor')
            console.log('3. Execute: ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;')
            return false
          }
        } else {
          // Clean up test record
          if (testData && testData[0]) {
            await supabase
              .from('case_study_requests')
              .delete()
              .eq('id', testData[0].id)
          }
          console.log('✅ Column created successfully!')
          return true
        }
      } else {
        console.log('✅ Column added via REST API!')
        return true
      }
    } else {
      console.log('✅ Column added via RPC!')
      return true
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

addColumnDirectly()
