import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  instructor_legal_area?: string // Legacy field - will be deprecated
  legal_areas?: string[] // New multi-area field
  email_notifications_enabled?: boolean
  account_credits: number
  created_at: string
  updated_at: string
}

interface UserContextType {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  updateCredits: (newCredits: number) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUserProfile = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  const updateCredits = (newCredits: number) => {
    if (profile) {
      setProfile({ ...profile, account_credits: newCredits })
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  // Set up real-time subscription for user profile changes
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('user_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          setProfile(payload.new as UserProfile)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const value: UserContextType = {
    profile,
    loading,
    refreshProfile,
    updateCredits
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
