import { supabase } from '../lib/supabase'

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('packages').select('count', { count: 'exact' })
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase test failed:', error)
    return false
  }
}

export const createTestUser = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })
    
    if (error) {
      console.error('User creation error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('User created successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('User creation failed:', error)
    return { success: false, error: 'Unknown error' }
  }
}
