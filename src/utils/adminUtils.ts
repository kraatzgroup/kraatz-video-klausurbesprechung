import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
)

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'student' | 'instructor' | 'admin'
}

export async function createUserAsAdmin(userData: CreateUserData) {
  try {
    // First, create the user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName
      },
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Wait a moment for the trigger to create the user record
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update the user role if it's not 'student' (default)
    if (userData.role !== 'student') {
      const { error: roleError } = await supabaseAdmin
        .from('users')
        .update({ role: userData.role })
        .eq('id', authData.user.id)

      if (roleError) {
        console.warn('Role update failed:', roleError.message)
        // Don't throw here as the user was created successfully
      }
    }

    return {
      success: true,
      user: authData.user,
      message: `User ${userData.email} created successfully with role ${userData.role}`
    }

  } catch (error) {
    console.error('Admin user creation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`)
  }

  return data
}

export async function updateUserRole(userId: string, role: 'student' | 'instructor' | 'admin') {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  return { success: true }
}
