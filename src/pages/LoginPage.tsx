import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLoginSuccess = async () => {
    // Check user role and redirect accordingly
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (data && !error) {
          const role = data.role || 'student'
          if (role === 'instructor') {
            navigate('/instructor')
          } else {
            navigate('/dashboard')
          }
        } else {
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        navigate('/dashboard')
      }
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  )
}
