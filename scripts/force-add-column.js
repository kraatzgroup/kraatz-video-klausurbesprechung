require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function forceAddColumn() {
  try {
    console.log('Attempting to force add scoring_sheet_url column via HTTP...')
    
    // Try direct HTTP request to Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: 'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_sheet_url TEXT;'
      })
    })

    if (response.ok) {
      console.log('✅ Column added successfully via HTTP!')
      return true
    }

    // Try alternative endpoint
    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
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

    if (response2.ok) {
      console.log('✅ Column added successfully via alternative endpoint!')
      return true
    }

    // Try using pg library directly
    const { Client } = require('pg')
    
    const client = new Client({
      host: 'db.rpgbyockvpannrupicno.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || 'your-db-password',
      ssl: { rejectUnauthorized: false }
    })

    try {
      await client.connect()
      console.log('Connected to database directly')
      
      await client.query('ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_sheet_url TEXT;')
      await client.query('CREATE INDEX IF NOT EXISTS idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);')
      
      console.log('✅ Column added successfully via direct database connection!')
      await client.end()
      return true
      
    } catch (dbError) {
      console.log('Direct database connection failed:', dbError.message)
      await client.end().catch(() => {})
    }

    console.log('❌ All automatic methods failed.')
    console.log('')
    console.log('The scoring_sheet_url column must be added manually.')
    console.log('Please execute this SQL in the Supabase dashboard:')
    console.log('')
    console.log('ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;')
    console.log('CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);')
    
    return false

  } catch (error) {
    console.error('Error in force add column:', error)
    return false
  }
}

forceAddColumn()
