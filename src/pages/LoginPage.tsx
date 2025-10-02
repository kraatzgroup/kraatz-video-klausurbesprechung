import React from 'react'
import { StudentLoginForm } from '../components/auth/StudentLoginForm'
import { useNavigate } from 'react-router-dom'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    // Students will be redirected via magic link to dashboard
    navigate('/dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Kraatz Club
          </h1>
          <p className="text-text-secondary">
            Videobesprechung für Studenten
          </p>
        </div>
        <StudentLoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}
