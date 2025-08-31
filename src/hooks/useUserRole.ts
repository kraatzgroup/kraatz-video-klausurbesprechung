import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'instructor' | 'student'

interface UserProfile {
  role: UserRole
  first_name: string
  last_name: string
  account_credits: number
}

export const useUserRole = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, first_name, last_name, account_credits')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!userProfile) return false

    const roleHierarchy: Record<UserRole, number> = {
      student: 1,
      instructor: 2,
      admin: 3
    }

    return roleHierarchy[userProfile.role] >= roleHierarchy[requiredRole]
  }

  const canAccessRoute = (routeRole: UserRole): boolean => {
    return hasRole(routeRole)
  }

  return {
    userProfile,
    loading,
    hasRole,
    canAccessRoute,
    isAdmin: userProfile?.role === 'admin',
    isInstructor: userProfile?.role === 'instructor',
    isStudent: userProfile?.role === 'student'
  }
}
