require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestResults() {
  try {
    console.log('🔄 Adding grade columns to submissions table...')
    
    // Add grade columns if they don't exist
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.submissions 
        ADD COLUMN IF NOT EXISTS grade NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 18),
        ADD COLUMN IF NOT EXISTS grade_text TEXT;
      `
    })

    // Add study_phase column to case_study_requests if it doesn't exist
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.case_study_requests 
        ADD COLUMN IF NOT EXISTS study_phase TEXT;
      `
    })

    console.log('✅ Database schema updated')

    // Get demo user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@kraatz-club.de')
      .single()

    if (userError || !userData) {
      console.log('❌ Demo user not found')
      return
    }

    const userId = userData.id
    console.log('👤 Found demo user:', userId)

    // Create test case study requests with different legal areas
    const testRequests = [
      {
        user_id: userId,
        study_phase: 'Grund- und Hauptstudium',
        legal_area: 'Zivilrecht',
        sub_area: 'BGB AT',
        focus_area: 'Stellvertretung',
        status: 'corrected'
      },
      {
        user_id: userId,
        study_phase: '1. Examensvorbereitung',
        legal_area: 'Strafrecht',
        sub_area: 'Strafrecht AT',
        focus_area: 'Vorsatz und Fahrlässigkeit',
        status: 'corrected'
      },
      {
        user_id: userId,
        study_phase: 'Grund- und Hauptstudium',
        legal_area: 'Zivilrecht',
        sub_area: 'Schuldrecht BT',
        focus_area: 'Kaufvertrag',
        status: 'corrected'
      },
      {
        user_id: userId,
        study_phase: '1. Examensvorbereitung',
        legal_area: 'Öffentliches Recht',
        sub_area: 'Staatsrecht',
        focus_area: 'Grundrechte',
        status: 'corrected'
      },
      {
        user_id: userId,
        study_phase: 'Grund- und Hauptstudium',
        legal_area: 'Zivilrecht',
        sub_area: 'BGB AT',
        focus_area: 'Anfechtung',
        status: 'corrected'
      }
    ]

    console.log('📝 Creating test case study requests...')
    const { data: requestsData, error: requestsError } = await supabase
      .from('case_study_requests')
      .insert(testRequests)
      .select('id')

    if (requestsError) {
      console.error('Error creating requests:', requestsError)
      return
    }

    console.log('✅ Created', requestsData.length, 'test requests')

    // Create test submissions with grades
    const testSubmissions = [
      {
        case_study_request_id: requestsData[0].id,
        file_url: 'test-submission-1.pdf',
        file_type: 'pdf',
        status: 'corrected',
        correction_video_url: 'https://example.com/video1.mp4',
        grade: 12.5,
        grade_text: 'Gut',
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        corrected_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        case_study_request_id: requestsData[1].id,
        file_url: 'test-submission-2.pdf',
        file_type: 'pdf',
        status: 'corrected',
        correction_video_url: 'https://example.com/video2.mp4',
        grade: 8.5,
        grade_text: 'Befriedigend',
        submitted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        corrected_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days ago
      },
      {
        case_study_request_id: requestsData[2].id,
        file_url: 'test-submission-3.pdf',
        file_type: 'pdf',
        status: 'corrected',
        correction_video_url: 'https://example.com/video3.mp4',
        grade: 14.0,
        grade_text: 'Sehr gut',
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        corrected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        case_study_request_id: requestsData[3].id,
        file_url: 'test-submission-4.pdf',
        file_type: 'pdf',
        status: 'corrected',
        correction_video_url: 'https://example.com/video4.mp4',
        grade: 6.5,
        grade_text: 'Ausreichend',
        submitted_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
        corrected_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString() // 19 days ago
      },
      {
        case_study_request_id: requestsData[4].id,
        file_url: 'test-submission-5.pdf',
        file_type: 'pdf',
        status: 'corrected',
        correction_video_url: 'https://example.com/video5.mp4',
        grade: 15.5,
        grade_text: 'Sehr gut',
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        corrected_at: new Date().toISOString() // today
      }
    ]

    console.log('📊 Creating test submissions with grades...')
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .insert(testSubmissions)

    if (submissionsError) {
      console.error('Error creating submissions:', submissionsError)
      return
    }

    console.log('✅ Created', testSubmissions.length, 'test submissions with grades')
    console.log('🎉 Test data creation complete!')
    console.log('📈 You can now view results at /results page')

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

createTestResults()
