const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies for video_lessons table...')
    
    // First, try to query without authentication
    console.log('\n1. Testing unauthenticated access...')
    const { data: unauthData, error: unauthError } = await supabase
      .from('video_lessons')
      .select('*')
      .limit(1)

    if (unauthError) {
      console.log('❌ Unauthenticated access failed:', unauthError.message)
    } else {
      console.log('✅ Unauthenticated access works, found', unauthData?.length || 0, 'videos')
    }

    // Check if we can see the policies
    console.log('\n2. Checking table policies...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'video_lessons')

    if (policyError) {
      console.log('⚠️  Cannot check policies:', policyError.message)
    } else {
      console.log('Found', policies?.length || 0, 'policies for video_lessons table')
      policies?.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} for ${policy.roles}`)
      })
    }

    // Try to disable RLS temporarily to test
    console.log('\n3. Testing with service role key (if available)...')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const adminSupabase = createClient(supabaseUrl, serviceKey)
      const { data: adminData, error: adminError } = await adminSupabase
        .from('video_lessons')
        .select('*')
        .limit(5)

      if (adminError) {
        console.log('❌ Service role access failed:', adminError.message)
      } else {
        console.log('✅ Service role access works, found', adminData?.length || 0, 'videos')
        if (adminData && adminData.length > 0) {
          console.log('Sample video:', adminData[0].title)
        }
      }
    } else {
      console.log('⚠️  No service role key found in environment')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkRLSPolicies()
