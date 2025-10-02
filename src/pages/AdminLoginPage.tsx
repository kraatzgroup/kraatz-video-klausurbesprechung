import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLoginSuccess = async () => {
    // Check user role and redirect accordingly for admin/instructor users
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
          } else if (role === 'admin') {
            navigate('/admin/dashboard')
          } else if (role === 'springer') {
            navigate('/instructor') // Springer use instructor dashboard
          } else {
            // Students should not be able to login via admin page
            navigate('/login')
          }
        } else {
          navigate('/admin/dashboard')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        navigate('/admin/dashboard')
      }
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Admin & Dozenten Login
          </h1>
          <p className="text-text-secondary">
            Anmeldung für Dozenten, Springer und Administratoren
          </p>
        </div>
        <LoginForm onSuccess={handleLoginSuccess} />
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Student?{' '}
            <a href="/login" className="text-primary hover:text-blue-700">
              Hier zur Studenten-Anmeldung
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
