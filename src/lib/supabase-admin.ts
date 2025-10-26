import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co'

// For frontend admin operations, we should use an Edge Function instead of service role key
// But for now, let's try to get the service key from environment
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn('⚠️ REACT_APP_SUPABASE_SERVICE_ROLE_KEY not found - admin operations may fail')
  console.warn('⚠️ Consider moving admin operations to Edge Functions for better security')
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
          storageKey: 'kraatz-club-admin-storage', // Unique storage key
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'kraatz-club-admin-service'
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
