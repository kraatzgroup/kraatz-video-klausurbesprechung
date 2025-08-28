import React from 'react'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useNavigate } from 'react-router-dom'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()

  const handleRegisterSuccess = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <RegisterForm onSuccess={handleRegisterSuccess} />
    </div>
  )
}
