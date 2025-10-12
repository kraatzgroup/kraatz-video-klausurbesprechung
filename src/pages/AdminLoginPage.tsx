import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLoginSuccess = async () => {
    // Check user role and redirect accordingly for admin/instructor users
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('🚨 SECURITY: User not found in database:', error)
          console.error('🚨 SECURITY: Unauthorized access attempt by:', user.email)
          
          // Show error message instead of logout loop
          setErrorMessage(`Zugriff verweigert: Die E-Mail-Adresse ${user.email} ist nicht für den Admin-Bereich berechtigt.`)
          await supabase.auth.signOut()
          return
        }
        
        if (data && data.role) {
          const role = data.role
          if (role === 'instructor') {
            navigate('/instructor')
          } else if (role === 'admin') {
            navigate('/admin/dashboard')
          } else if (role === 'springer') {
            navigate('/instructor') // Springer use instructor dashboard
          } else {
            // Students should not be able to login via admin page
            setErrorMessage('Studenten können sich nicht über den Admin-Bereich anmelden. Bitte nutzen Sie die Studenten-Anmeldung.')
            await supabase.auth.signOut()
          }
        } else {
          console.error('🚨 SECURITY: No role data returned for authenticated user')
          setErrorMessage('Fehler beim Laden der Benutzerdaten. Zugriff verweigert.')
          await supabase.auth.signOut()
        }
      } catch (error) {
        console.error('🚨 SECURITY: Database error during user validation:', error)
        setErrorMessage('Datenbankfehler bei der Benutzervalidierung. Zugriff verweigert.')
        await supabase.auth.signOut()
      }
    } else {
      // No user authenticated, redirect to login
      navigate('/login')
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
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <LoginForm onSuccess={handleLoginSuccess} />
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-text-secondary">
            <a href="/forgot-password" className="text-primary hover:text-blue-700">
              Passwort vergessen?
            </a>
          </p>
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
