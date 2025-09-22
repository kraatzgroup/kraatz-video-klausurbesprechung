const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('REACT_APP_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createRatingsTable() {
  try {
    console.log('🚀 Creating case_study_ratings table...')
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/create-case-study-ratings-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL script...')
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Error executing SQL:', error)
      
      // Try alternative approach - execute statements individually
      console.log('🔄 Trying alternative approach...')
      
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
      
      for (const statement of statements) {
        const trimmedStatement = statement.trim()
        if (trimmedStatement) {
          console.log('Executing:', trimmedStatement.substring(0, 50) + '...')
          
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: trimmedStatement + ';' 
          })
          
          if (stmtError) {
            console.error('❌ Error in statement:', stmtError)
            console.error('Statement was:', trimmedStatement)
          } else {
            console.log('✅ Statement executed successfully')
          }
        }
      }
    } else {
      console.log('✅ SQL script executed successfully')
    }
    
    // Verify table creation
    console.log('🔍 Verifying table creation...')
    const { data: tableCheck, error: checkError } = await supabase
      .from('case_study_ratings')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Table verification failed:', checkError)
    } else {
      console.log('✅ Table case_study_ratings created successfully!')
      console.log('📊 Table is ready for use')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the function
createRatingsTable()
