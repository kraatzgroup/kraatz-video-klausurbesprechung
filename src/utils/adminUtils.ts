import { supabaseAdmin } from '../lib/supabase-admin'

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
    console.log('Creating user with data:', userData)
    
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

    console.log('Auth creation result:', { authData, authError })

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Wait longer for the trigger to create the user record
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if user record was created by trigger
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    console.log('Existing user check:', { existingUser, checkError })

    // Always create user record manually since trigger is unreliable
    if (!existingUser) {
      console.log('Creating user record manually...')
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          instructor_legal_area: (userData.role === 'instructor' || userData.role === 'springer') ? userData.instructorLegalArea : null,
          legal_areas: (userData.role === 'instructor' || userData.role === 'springer') ? 
            (userData.legalAreas || (userData.instructorLegalArea ? [userData.instructorLegalArea] : null)) : null,
          account_credits: userData.role === 'student' ? 0 : null
        })

      if (insertError) {
        console.error('Manual user insert failed:', insertError)
        throw new Error(`Failed to create user record: ${insertError.message}`)
      }
    } else {
      // Update existing user record with role and legal area
      const updateData: any = {}
      
      if (userData.role !== 'student') {
        updateData.role = userData.role
      }
      
      if ((userData.role === 'instructor' || userData.role === 'springer')) {
        if (userData.legalAreas) {
          updateData.legal_areas = userData.legalAreas
          updateData.instructor_legal_area = userData.legalAreas[0] // Keep legacy field for compatibility
        } else if (userData.instructorLegalArea) {
          updateData.instructor_legal_area = userData.instructorLegalArea
          updateData.legal_areas = [userData.instructorLegalArea]
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', authData.user.id)

        console.log('User update result:', updateError)

        if (updateError) {
          console.warn('User update failed:', updateError.message)
          // Don't throw here as the user was created successfully
        }
      }
    }

    // Final verification that user was created
    const { data: finalCheck } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    console.log('Final user verification:', finalCheck)

    return {
      success: true,
      user: authData.user,
      message: `User ${userData.email} created successfully with role ${userData.role}`,
      createdUser: finalCheck
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

export async function updateUserRole(userId: string, role: 'student' | 'instructor' | 'admin' | 'springer') {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  return { success: true }
}
