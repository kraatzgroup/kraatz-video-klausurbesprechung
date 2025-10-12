import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co'
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ REACT_APP_SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  throw new Error('Missing REACT_APP_SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Singleton pattern to avoid multiple instances
let adminClientInstance: any = null

const getSupabaseAdmin = () => {
  if (!adminClientInstance) {
    console.log('🔧 Creating Supabase Admin singleton instance...')
    
    try {
      // Create admin client with service role key
      adminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'kraatz-club-admin-storage' // Unique storage key
        },
        global: {
          headers: {
            'X-Client-Info': 'kraatz-club-admin'
          }
        }
      }) as any
      
      console.log('✅ Supabase Admin singleton created successfully')
      
    } catch (error) {
      console.error('❌ Failed to create Supabase Admin client:', error)
      
      // Return a mock client that throws errors for any operation
      adminClientInstance = new Proxy({}, {
        get() {
          throw new Error('Supabase Admin client is not properly configured. Please check your environment variables.')
        }
      }) as any
    }
  }
  
  return adminClientInstance
}

// Create the singleton instance
const supabaseAdmin = getSupabaseAdmin()

export { supabaseAdmin }
export default supabaseAdmin
