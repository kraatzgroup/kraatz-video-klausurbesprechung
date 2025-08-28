import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleBasedRedirect } from '../../utils/roleRedirect'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      // Get current user and redirect based on role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const redirectPath = await getRoleBasedRedirect(user.id)
        window.location.href = redirectPath
      } else {
        onSuccess?.()
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto bg-box-bg p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
        Anmelden
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            E-Mail-Adresse
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ihre.email@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            Passwort
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ihr Passwort"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Wird angemeldet...' : 'Anmelden'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          to="/forgot-password"
          className="text-primary hover:text-blue-700 text-sm"
        >
          Passwort vergessen?
        </Link>
        <div className="text-text-secondary text-sm">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-primary hover:text-blue-700">
            Jetzt registrieren
          </Link>
        </div>
      </div>
    </div>
  )
}
