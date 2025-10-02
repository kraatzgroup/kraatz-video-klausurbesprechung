import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { StripeUserService } from '../services/stripeUserService'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'student' | 'instructor' | 'admin' | 'springer'
  account_credits: number
  stripe_customer_id: string | null
  email_notifications_enabled: boolean
  profile_image_url: string | null
}

export const useStripeAuth = () => {
  const { user, session, loading: authLoading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user || authLoading) {
        setLoading(authLoading)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // User doesn't exist in database - this shouldn't happen with proper Stripe integration
          // but we'll handle it gracefully
          console.error('❌ User profile not found in database:', profileError)
          
          if (profileError.code === 'PGRST116') {
            // User not found - create from auth user
            console.log('👤 Creating user profile from auth user')
            
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email || '',
                first_name: user.user_metadata?.first_name || null,
                last_name: user.user_metadata?.last_name || null,
                role: 'student',
                account_credits: 0,
                stripe_customer_id: null,
                email_notifications_enabled: true
              })
              .select()
              .single()

            if (createError) {
              console.error('❌ Error creating user profile:', createError)
              setError('Fehler beim Erstellen des Benutzerprofils')
              return
            }

            setUserProfile(newProfile)
          } else {
            setError('Fehler beim Laden des Benutzerprofils')
            return
          }
        } else {
          setUserProfile(profile)
        }

        // Check if user has Stripe customer ID
        if (profile && !profile.stripe_customer_id) {
          console.log('⚠️ User has no Stripe customer ID - this may limit payment functionality')
          // Note: This is expected for users created before Stripe integration
          // They will get a Stripe customer ID when they make their first purchase
        }

      } catch (error) {
        console.error('❌ Error loading user profile:', error)
        setError('Unerwarteter Fehler beim Laden des Profils')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [user, authLoading])

  const refreshUserProfile = async () => {
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ Error refreshing user profile:', error)
        return
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('❌ Error in refreshUserProfile:', error)
    }
  }

  const checkStripeCustomerStatus = async (): Promise<boolean> => {
    if (!userProfile) return false
    return !!userProfile.stripe_customer_id
  }

  const getUserStripeCustomerId = (): string | null => {
    return userProfile?.stripe_customer_id || null
  }

  return {
    user,
    session,
    userProfile,
    loading,
    error,
    refreshUserProfile,
    checkStripeCustomerStatus,
    getUserStripeCustomerId,
    hasStripeCustomer: !!userProfile?.stripe_customer_id
  }
}
