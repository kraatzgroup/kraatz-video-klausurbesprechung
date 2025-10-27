import { supabase } from '../lib/supabase'
import { NotificationService } from '../services/notificationService'

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'student' | 'instructor' | 'admin' | 'springer'
  instructorLegalArea?: 'Zivilrecht' | 'Strafrecht' | 'Öffentliches Recht' // Legacy - single area
  legalAreas?: ('Zivilrecht' | 'Strafrecht' | 'Öffentliches Recht')[] // New - multiple areas
}

export async function createUserAsAdmin(userData: CreateUserData) {
  try {
    console.log('🚀 Creating user via Edge Function:', userData.email)
    
    // Use the new Edge Function for secure user creation
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        instructorLegalArea: userData.instructorLegalArea
      }
    })

    if (error) {
      console.error('❌ Edge Function error:', error)
      return {
        success: false,
        error: `Failed to create user: ${error.message}`
      }
    }

    if (!data.success) {
      console.error('❌ User creation failed:', data.error)
      return {
        success: false,
        error: data.error || 'User creation failed'
      }
    }

    console.log('✅ User created successfully via Edge Function:', data.message)

    // Create welcome notification ONLY for instructor, springer, and admin roles - NOT for students
    if (userData.role === 'instructor' || userData.role === 'springer' || userData.role === 'admin') {
      try {
        console.log(`📢 Creating welcome notification for ${userData.role}...`)
        await NotificationService.createWelcomeNotification(
          data.user.id,
          `${userData.firstName} ${userData.lastName}`,
          userData.role,
          userData.instructorLegalArea
        )
        console.log('✅ Welcome notification created successfully')
      } catch (notificationError) {
        console.warn('⚠️ Welcome notification error:', notificationError)
        // Don't fail the user creation if notification fails
      }
    } else {
      console.log(`ℹ️ Skipping welcome notification for role: ${userData.role} (only sent to instructor/springer/admin)`)
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
      createdUser: data.createdUser
    }

  } catch (error) {
    console.error('❌ Admin user creation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`)
  }

  return data
}

export async function updateUserRole(userId: string, role: 'student' | 'instructor' | 'admin' | 'springer') {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  return { success: true }
}
