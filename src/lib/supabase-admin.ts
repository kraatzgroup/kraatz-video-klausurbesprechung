import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ REACT_APP_SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  throw new Error('Missing REACT_APP_SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create the admin client directly with fallback values
console.log('🔧 Creating Supabase Admin client...')

let supabaseAdmin: any

try {
  // Create admin client with service role key
  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'kraatz-club-admin-storage' // Different storage key to avoid conflicts
    },
    global: {
      headers: {
        'X-Client-Info': 'kraatz-club-admin'
      }
    }
  })
  
  console.log('✅ Supabase Admin client created successfully')
  
  // Export the admin client with type assertion to bypass TypeScript issues
  supabaseAdmin = adminClient as any
  
} catch (error) {
  console.error('❌ Failed to create Supabase Admin client:', error)
  
  // Export a mock client that throws errors for any operation
  supabaseAdmin = new Proxy({}, {
    get() {
      throw new Error('Supabase Admin client is not properly configured. Please check your environment variables.')
    }
  }) as any
}

export { supabaseAdmin }
export default supabaseAdmin
