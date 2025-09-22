const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
})

async function addColumnViaServiceRole() {
  try {
    console.log('Attempting to add column via Supabase service role...')
    
    // Method 1: Try using raw SQL via RPC
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'case_study_requests' AND column_name = 'scoring_sheet_url'
            ) THEN
              ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;
              CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);
              RAISE NOTICE 'Column added successfully';
            ELSE
              RAISE NOTICE 'Column already exists';
            END IF;
          END $$;
        `
      })

      if (!error) {
        console.log('✅ Column added via RPC exec')
        return await verifyColumn()
      }
      console.log('RPC exec failed:', error.message)
    } catch (e) {
      console.log('RPC exec method failed:', e.message)
    }

    // Method 2: Try direct table modification
    try {
      // First check if column exists by trying to select it
      const { data: testData, error: testError } = await supabase
        .from('case_study_requests')
        .select('scoring_sheet_url')
        .limit(1)

      if (!testError) {
        console.log('✅ Column already exists!')
        return true
      }

      if (testError.message.includes('scoring_sheet_url')) {
        console.log('Column does not exist, attempting to add...')
        
        // Try to create a dummy record with the new column to force schema update
        const dummyId = '00000000-0000-0000-0000-000000000000'
        const { data: insertData, error: insertError } = await supabase
          .from('case_study_requests')
          .upsert({
            id: dummyId,
            user_id: dummyId,
            case_study_number: 999,
            study_phase: 'test',
            legal_area: 'test',
            sub_area: 'test',
            focus_area: 'test',
            status: 'requested',
            scoring_sheet_url: 'test'
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })

        if (!insertError) {
          console.log('✅ Column created via insert method')
          // Clean up test record
          await supabase
            .from('case_study_requests')
            .delete()
            .eq('id', dummyId)
          return true
        }
        console.log('Insert method failed:', insertError.message)
      }
    } catch (e) {
      console.log('Direct modification failed:', e.message)
    }

    // Method 3: Try using Supabase management API
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/alter_table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          table_name: 'case_study_requests',
          column_name: 'scoring_sheet_url',
          column_type: 'TEXT'
        })
      })

      if (response.ok) {
        console.log('✅ Column added via management API')
        return await verifyColumn()
      }
      console.log('Management API failed:', response.statusText)
    } catch (e) {
      console.log('Management API method failed:', e.message)
    }

    console.log('❌ All automatic methods failed')
    console.log('')
    console.log('Manual intervention required:')
    console.log('1. Go to https://supabase.com/dashboard/project/rpgbyockvpannrupicno')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Execute:')
    console.log('   ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;')
    console.log('   CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);')
    return false

  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

async function verifyColumn() {
  try {
    const { data, error } = await supabase
      .from('case_study_requests')
      .select('scoring_sheet_url')
      .limit(1)

    if (!error) {
      console.log('✅ Column verification successful')
      return true
    } else {
      console.log('❌ Column verification failed:', error.message)
      return false
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message)
    return false
  }
}

addColumnViaServiceRole()
