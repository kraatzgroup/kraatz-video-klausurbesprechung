import { supabase } from '../lib/supabase'

export interface PasswordResetData {
  email: string
  newPassword: string
}

export async function resetUserPassword(data: PasswordResetData) {
  try {
    console.log('🔐 Resetting password via Edge Function for:', data.email)
    
    const { data: result, error } = await supabase.functions.invoke('admin-password-reset', {
      body: {
        email: data.email,
        newPassword: data.newPassword
      }
    })

    if (error) {
      console.error('❌ Password reset error:', error)
      return {
        success: false,
        error: error.message || 'Failed to reset password'
      }
    }

    if (!result.success) {
      console.error('❌ Password reset failed:', result.error)
      return {
        success: false,
        error: result.error || 'Password reset failed'
      }
    }

    console.log('✅ Password reset successful:', result.message)
    return {
      success: true,
      message: result.message,
      user: result.user
    }

  } catch (error) {
    console.error('❌ Password reset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)] // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
