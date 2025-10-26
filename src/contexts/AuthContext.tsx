import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isValidUser: boolean | null
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  // resetPassword removed - now handled by Edge Function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isValidUser, setIsValidUser] = useState<boolean | null>(null)

  // Validate user exists in database
  const validateUser = async (user: User | null) => {
    if (!user) {
      setIsValidUser(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        console.error('🚨 SECURITY: User not found in database:', error)
        console.error('🚨 SECURITY: Unauthorized access attempt by:', user.email)
        
        // Mark as invalid but don't force logout immediately - let SecurityGate handle it
        setIsValidUser(false)
        return
      }

      setIsValidUser(true)
    } catch (error) {
      console.error('🚨 SECURITY: Database validation error:', error)
      setIsValidUser(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Validate user immediately
      validateUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Validate user on every auth change
      validateUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error }
    }

    return { error: null }
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setSession(null)
      
      // Then attempt Supabase signout
      await supabase.auth.signOut()
      
      // Even if there's an error (like session missing), we've cleared local state
      // so the user appears logged out in the UI
      return { error: null }
    } catch (error) {
      console.error('SignOut error:', error)
      // Still clear local state even if Supabase call fails
      setUser(null)
      setSession(null)
      return { error: null }
    }
  }

  // resetPassword function removed - now handled by send-password-reset Edge Function

  const value = {
    user,
    session,
    loading,
    isValidUser,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
