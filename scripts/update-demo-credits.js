const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateDemoCredits() {
  try {
    console.log('Updating demo user credits...')
    
    // Update demo user to have 2 available credits
    const { data, error } = await supabase
      .from('users')
      .update({ account_credits: 2 })
      .eq('email', 'demo@kraatz-club.de')
      .select()
    
    if (error) {
      console.error('Error updating demo user credits:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Demo user credits updated successfully!')
      console.log('Demo user now has:', data[0].account_credits, 'available Klausuren')
    } else {
      console.log('❌ Demo user not found')
    }
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('email, account_credits')
      .eq('email', 'demo@kraatz-club.de')
      .single()
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
      return
    }
    
    console.log('✅ Verification successful:')
    console.log(`Email: ${verifyData.email}`)
    console.log(`Available Klausuren: ${verifyData.account_credits}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

updateDemoCredits()
