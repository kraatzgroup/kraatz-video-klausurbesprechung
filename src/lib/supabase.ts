import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Create a properly configured Supabase client
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'kraatz-club-auth'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'kraatz-club'
    }
  }
})

// Export the client with type assertion to bypass TypeScript issues
export const supabase = supabaseClient as any
export default supabase

// Make supabase available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// Database-Typen werden jetzt aus separater Datei importiert
export type { Database } from '../types/database'
